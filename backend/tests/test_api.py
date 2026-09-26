from __future__ import annotations

from fastapi.testclient import TestClient


def create_maria_session(client: TestClient) -> str:
    response = client.post("/api/sessions", json={"patient_id": "pt-maria-conti"})
    assert response.status_code == 200
    return response.json()["session_id"]


def ask(client: TestClient, session_id: str, question: str, notes: str = "") -> dict:
    response = client.post(
        f"/api/sessions/{session_id}/chat",
        json={
            "question": question,
            "notes_text": notes,
            "transcript_segments": [],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_health_and_cross_doctor_session_rejection(api_client: TestClient) -> None:
    health = api_client.get("/api/health").json()
    assert health["ready"] is True
    assert health["synthetic"] is True
    response = api_client.post("/api/sessions", json={"patient_id": "pt-nora-ellis"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Patient record is unavailable"


def test_patient_sources_load_up_front_and_follow_consent(api_client: TestClient) -> None:
    loaded = api_client.get("/api/demo/patients/pt-maria-conti/sources")
    assert loaded.status_code == 200
    sources = loaded.json()["sources"]
    assert len(sources) > 0
    assert all(source["patient_id"] == "pt-maria-conti" for source in sources)
    assert any(source["id"] == "seg-maria-june-0412" for source in sources)

    changed = api_client.put(
        "/api/demo/patients/pt-maria-conti/consent/medications",
        json={"consented": False},
    )
    assert changed.status_code == 200
    refreshed = api_client.get("/api/demo/patients/pt-maria-conti/sources").json()["sources"]
    assert all(source["consent_category"] != "medications" for source in refreshed)

    unavailable = api_client.get("/api/demo/patients/pt-nora-ellis/sources")
    assert unavailable.status_code == 404


def test_notes_start_blank_and_insights_use_latest_transcript(api_client: TestClient) -> None:
    created = api_client.post("/api/sessions", json={"patient_id": "pt-maria-conti"})
    assert created.status_code == 200
    assert created.json()["notes_text"] == ""
    session_id = created.json()["session_id"]

    first = api_client.post(
        f"/api/sessions/{session_id}/insights",
        json={
            "notes_text": "Follow up next week.",
            "transcript_segments": [
                {
                    "id": "insight-1",
                    "speaker": "patient",
                    "start_ms": 0,
                    "end_ms": 2000,
                    "text": "My appetite has been lower.",
                    "is_final": True,
                }
            ],
        },
    )
    assert first.status_code == 200
    assert first.json()["transcript_segment_count"] == 1
    assert "appetite" in first.json()["insights"][0]["text"].lower()

    regenerated = api_client.post(
        f"/api/sessions/{session_id}/insights",
        json={
            "notes_text": "Follow up next week.",
            "transcript_segments": [
                {
                    "id": "insight-1",
                    "speaker": "patient",
                    "start_ms": 0,
                    "end_ms": 2000,
                    "text": "My appetite has been lower.",
                    "is_final": True,
                },
                {
                    "id": "insight-2",
                    "speaker": "clinician",
                    "start_ms": 2100,
                    "end_ms": 4000,
                    "text": "We will order blood work tomorrow.",
                    "is_final": True,
                },
            ],
        },
    )
    assert regenerated.status_code == 200
    assert regenerated.json()["transcript_segment_count"] == 2
    insight_text = " ".join(item["text"] for item in regenerated.json()["insights"])
    assert "blood work" in insight_text.lower()


def test_chat_uses_latest_notes_and_valid_citations(api_client: TestClient) -> None:
    session_id = create_maria_session(api_client)
    response = ask(
        api_client,
        session_id,
        "What's changed since her last visit?",
        "Weight 66 kg. Yellow eyes observed just now.",
    )
    assert "yellow" in response["answer"].lower()
    source_ids = {source["id"] for source in response["sources"]}
    assert "current-note" in source_ids
    assert all(
        citation in source_ids
        for claim in response["claims"]
        for citation in claim["source_ids"]
    )
    assert len(response["graph"]["nodes"]) <= 8
    assert len(response["graph"]["edges"]) <= 10


def test_partial_live_transcript_is_not_evidence(api_client: TestClient) -> None:
    session_id = create_maria_session(api_client)
    response = api_client.post(
        f"/api/sessions/{session_id}/chat",
        json={
            "question": "Did she mention a purple rash today?",
            "notes_text": "",
            "transcript_segments": [
                {
                    "id": "partial-1",
                    "speaker": "patient",
                    "start_ms": 0,
                    "end_ms": 2000,
                    "text": "I have a purple rash",
                    "is_final": False,
                }
            ],
        },
    ).json()
    assert response["status"] == "insufficient_evidence"
    assert all(source["id"] != "live-partial-1" for source in response["sources"])


def test_revocation_blocks_next_answer_and_stales_old_answer(api_client: TestClient) -> None:
    session_id = create_maria_session(api_client)
    before = ask(api_client, session_id, "Why did Maria stop metformin?")
    assert any(source["id"] == "seg-maria-june-0412" for source in before["sources"])

    changed = api_client.put(
        "/api/demo/patients/pt-maria-conti/consent/medications",
        json={"consented": False},
    )
    assert changed.status_code == 200
    after = ask(api_client, session_id, "Why did Maria stop metformin?")
    assert after["status"] == "insufficient_evidence"
    assert "unavailable under the current consent" in after["answer"]
    assert all(source["consent_category"] != "medications" for source in after["sources"])

    restored = api_client.get(f"/api/sessions/{session_id}").json()
    first_assistant = next(
        message for message in restored["messages"] if message["role"] == "assistant"
    )
    assert first_assistant["stale"] is True
    assert first_assistant["sources"] == []


def test_cohort_and_local_task(api_client: TestClient) -> None:
    session_id = create_maria_session(api_client)
    cohort = ask(
        api_client,
        session_id,
        "Which of my patients over 50 were diagnosed with diabetes in the last two years and have lost more than 5% of their body weight?",
    )
    patient_ids = {source["patient_id"] for source in cohort["sources"]}
    assert patient_ids == {"pt-maria-conti", "pt-james-wu"}
    assert "pt-nora-ellis" not in patient_ids

    task = ask(
        api_client,
        session_id,
        "Add a follow-up: bilirubin, liver panel, lipase, CA 19-9 results by Thursday.",
        "Plan: bilirubin, liver panel, lipase, CA 19-9.",
    )["task"]
    assert task["local_only"] is True
    assert task["completed"] is False
