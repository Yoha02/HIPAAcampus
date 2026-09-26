from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .chat import GroundedChat
from .config import settings
from .db import database, initialize, seed
from .providers import BedrockAnswerProvider
from .records import PatientRecordService, RecordUnavailableError
from .schemas import (
    ChatRequest,
    ConsentUpdate,
    NotesUpdate,
    SessionCreate,
    TaskCreate,
    TranscriptUpdate,
)


DEFAULT_DEMO_NOTES = (
    "Current consultation: weight 66 kg. Yellowing of the eyes observed. "
    "I explained that we need urgent blood tests (bilirubin, liver panel, lipase and CA 19-9) "
    "and a pancreas-protocol CT. This is a plan for investigation, not a confirmed diagnosis."
)

app = FastAPI(title="HIPAcampus Local Demo API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

records = PatientRecordService()
chat = GroundedChat(records, settings.database_path.parent / "bte-cache.json")
model = BedrockAnswerProvider()


@app.on_event("startup")
def startup() -> None:
    if not settings.database_path.exists():
        seed()
    else:
        initialize()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _session(session_id: str) -> dict[str, Any]:
    with database() as connection:
        row = connection.execute(
            "SELECT * FROM sessions WHERE session_id = ? AND doctor_id = ?",
            (session_id, settings.doctor_id),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Session is unavailable")
    return dict(row)


def _handle_record_error(error: Exception) -> HTTPException:
    if isinstance(error, RecordUnavailableError):
        return HTTPException(status_code=404, detail="Patient record is unavailable")
    return HTTPException(status_code=400, detail=str(error))


def _upsert_transcript(session_id: str, segments: list[dict[str, Any]]) -> None:
    with database() as connection:
        for segment in segments:
            connection.execute(
                """
                INSERT INTO live_transcript_segments
                  (segment_id, session_id, speaker, start_ms, end_ms, text, is_final)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(segment_id) DO UPDATE SET
                  speaker = excluded.speaker,
                  start_ms = excluded.start_ms,
                  end_ms = excluded.end_ms,
                  text = excluded.text,
                  is_final = excluded.is_final
                WHERE live_transcript_segments.session_id = excluded.session_id
                """,
                (
                    segment["id"],
                    session_id,
                    segment["speaker"],
                    segment["start_ms"],
                    segment["end_ms"],
                    segment["text"],
                    int(segment["is_final"]),
                ),
            )


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ready": settings.database_path.exists(),
        "database": "sqlite",
        "mcp": "in_process_trusted_adapter; stdio_server_available",
        "model": model.status(),
        "transcription": "local_whisper_cpp_via_frontend",
        "bte": settings.bte_mode,
        "synthetic": True,
    }


@app.get("/api/demo/patients")
def list_patients() -> dict[str, Any]:
    return {"patients": records.list_patients(), "synthetic": True}


@app.post("/api/sessions")
def create_session(payload: SessionCreate) -> dict[str, Any]:
    try:
        summary = records.get_patient_summary(payload.patient_id)
    except Exception as error:
        raise _handle_record_error(error) from error
    session_id = f"session-{uuid.uuid4().hex[:12]}"
    now = _now()
    notes = DEFAULT_DEMO_NOTES if payload.patient_id == "pt-maria-conti" else ""
    with database() as connection:
        connection.execute(
            """
            INSERT INTO sessions
              (session_id, doctor_id, patient_id, notes_text, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session_id, settings.doctor_id, payload.patient_id, notes, now, now),
        )
    return {
        "session_id": session_id,
        "patient_id": payload.patient_id,
        "notes_text": notes,
        "summary": summary,
        "messages": [],
        "tasks": [],
        "synthetic": True,
    }


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str) -> dict[str, Any]:
    session = _session(session_id)
    consent = records.get_consent(session["patient_id"])
    allowed = {
        category
        for category, state in consent["categories"].items()
        if state["consented"]
    }
    with database() as connection:
        transcript = [
            dict(row)
            for row in connection.execute(
                """
                SELECT segment_id AS id, speaker, start_ms, end_ms, text, is_final
                FROM live_transcript_segments WHERE session_id = ? ORDER BY start_ms
                """,
                (session_id,),
            ).fetchall()
        ]
        answer_rows = connection.execute(
            "SELECT question, response_json FROM answers WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        ).fetchall()
        tasks = [
            dict(row)
            for row in connection.execute(
                """
                SELECT task_id, text, due_date, completed_bool AS completed,
                       local_only_bool AS local_only
                FROM session_tasks WHERE session_id = ? ORDER BY created_at
                """,
                (session_id,),
            ).fetchall()
        ]
    messages = []
    for row in answer_rows:
        response = json.loads(row["response_json"])
        stale = any(
            source.get("consent_category") not in allowed
            for source in response.get("sources", [])
        )
        messages.append({"role": "user", "text": row["question"]})
        if stale:
            messages.append(
                {
                    "role": "assistant",
                    "answer": "A previous answer is unavailable because consent changed.",
                    "claims": [],
                    "sources": [],
                    "stale": True,
                }
            )
        else:
            messages.append({"role": "assistant", **response})
    return {
        **session,
        "summary": records.get_patient_summary(session["patient_id"]),
        "transcript_segments": transcript,
        "messages": messages,
        "tasks": tasks,
        "consent": consent,
        "synthetic": True,
    }


@app.put("/api/sessions/{session_id}/notes")
def update_notes(session_id: str, payload: NotesUpdate) -> dict[str, Any]:
    _session(session_id)
    with database() as connection:
        connection.execute(
            "UPDATE sessions SET notes_text = ?, updated_at = ? WHERE session_id = ?",
            (payload.notes_text, _now(), session_id),
        )
    return {"saved": True}


@app.put("/api/sessions/{session_id}/transcript")
def update_transcript(session_id: str, payload: TranscriptUpdate) -> dict[str, Any]:
    _session(session_id)
    _upsert_transcript(session_id, [segment.model_dump() for segment in payload.segments])
    return {"saved": True, "final_segments": sum(item.is_final for item in payload.segments)}


@app.post("/api/sessions/{session_id}/chat")
async def answer_chat(session_id: str, payload: ChatRequest) -> dict[str, Any]:
    session = _session(session_id)
    segments = [segment.model_dump() for segment in payload.transcript_segments]
    with database() as connection:
        connection.execute(
            "UPDATE sessions SET notes_text = ?, updated_at = ? WHERE session_id = ?",
            (payload.notes_text, _now(), session_id),
        )
    _upsert_transcript(session_id, segments)
    response = await chat.answer(
        session["patient_id"],
        payload.question,
        payload.notes_text,
        segments,
    )
    response_payload = response.model_dump()
    if response.task:
        task_id = f"task-{uuid.uuid4().hex[:10]}"
        response_payload["task"] = {**response.task, "task_id": task_id}
        with database() as connection:
            connection.execute(
                """
                INSERT INTO session_tasks
                  (task_id, session_id, text, due_date, completed_bool, local_only_bool, created_at)
                VALUES (?, ?, ?, ?, 0, 1, ?)
                """,
                (
                    task_id,
                    session_id,
                    response.task["text"],
                    response.task["due_date"],
                    _now(),
                ),
            )
    with database() as connection:
        connection.execute(
            """
            INSERT INTO answers
              (answer_id, session_id, question, response_json, consent_version, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                response.answer_id,
                session_id,
                payload.question,
                json.dumps(response_payload),
                response.consent_version,
                _now(),
            ),
        )
    return response_payload


@app.get("/api/demo/patients/{patient_id}/consent")
def get_consent(patient_id: str) -> dict[str, Any]:
    try:
        return records.get_consent(patient_id)
    except Exception as error:
        raise _handle_record_error(error) from error


@app.put("/api/demo/patients/{patient_id}/consent/{category}")
def set_consent(patient_id: str, category: str, payload: ConsentUpdate) -> dict[str, Any]:
    try:
        return records.set_consent(patient_id, category, payload.consented)
    except Exception as error:
        raise _handle_record_error(error) from error


@app.post("/api/sessions/{session_id}/tasks")
def create_task(session_id: str, payload: TaskCreate) -> dict[str, Any]:
    _session(session_id)
    task_id = f"task-{uuid.uuid4().hex[:10]}"
    with database() as connection:
        connection.execute(
            """
            INSERT INTO session_tasks
              (task_id, session_id, text, due_date, completed_bool, local_only_bool, created_at)
            VALUES (?, ?, ?, ?, 0, 1, ?)
            """,
            (task_id, session_id, payload.text, payload.due_date, _now()),
        )
    return {
        "task_id": task_id,
        "text": payload.text,
        "due_date": payload.due_date,
        "completed": False,
        "local_only": True,
    }


@app.post("/api/sessions/{session_id}/reset")
def reset_session(session_id: str) -> dict[str, Any]:
    session = _session(session_id)
    notes = DEFAULT_DEMO_NOTES if session["patient_id"] == "pt-maria-conti" else ""
    with database() as connection:
        connection.execute("DELETE FROM answers WHERE session_id = ?", (session_id,))
        connection.execute("DELETE FROM live_transcript_segments WHERE session_id = ?", (session_id,))
        connection.execute("DELETE FROM session_tasks WHERE session_id = ?", (session_id,))
        connection.execute(
            "UPDATE sessions SET notes_text = ?, updated_at = ? WHERE session_id = ?",
            (notes, _now(), session_id),
        )
        next_version = records._consent_version(connection, session["patient_id"]) + 1
        connection.execute(
            """
            UPDATE consent_flags SET consented_bool = 1, version = ?, last_updated = ?
            WHERE patient_id = ?
            """,
            (next_version, _now(), session["patient_id"]),
        )
    return {"reset": True, "notes_text": notes, "synthetic": True}
