from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from typing import Any

from .config import settings
from .db import database


class RecordUnavailableError(Exception):
    """Generic response for unknown and out-of-scope patients."""


class UnsupportedCohortCriteria(ValueError):
    pass


def _row(row: Any) -> dict[str, Any]:
    return dict(row)


def _age(dob: str, on_date: date = date(2026, 9, 26)) -> int:
    born = date.fromisoformat(dob)
    return on_date.year - born.year - ((on_date.month, on_date.day) < (born.month, born.day))


def _terms(value: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", value.lower())
    normalized = set(words)
    for word in words:
        for suffix in ("ing", "ed", "es", "s"):
            if word.endswith(suffix) and len(word) > len(suffix) + 3:
                normalized.add(word[: -len(suffix)])
    return normalized


class PatientRecordService:
    MAX_RECENT = 10
    MAX_HISTORY_SOURCES = 50
    MAX_COHORT_RESULTS = 10
    COHORT_KEYS = {
        "minimum_age",
        "diagnosis_code_or_display",
        "diagnosed_since",
        "minimum_weight_loss_percent",
        "result_limit",
    }

    def __init__(self, doctor_id: str | None = None, database_path: Path | None = None):
        self.doctor_id = doctor_id or settings.doctor_id
        self.database_path = database_path

    def _verify_scope(self, connection: Any, patient_id: str) -> dict[str, Any]:
        result = connection.execute(
            """
            SELECT p.* FROM patients p
            JOIN doctor_patients dp ON dp.patient_id = p.patient_id
            WHERE p.patient_id = ? AND dp.doctor_id = ?
              AND dp.active_from <= date('now')
              AND (dp.active_to IS NULL OR dp.active_to >= date('now'))
            """,
            (patient_id, self.doctor_id),
        ).fetchone()
        if result is None:
            raise RecordUnavailableError("Patient record is unavailable")
        return _row(result)

    @staticmethod
    def _consent_map(connection: Any, patient_id: str) -> dict[str, bool]:
        rows = connection.execute(
            "SELECT category, consented_bool FROM consent_flags WHERE patient_id = ?",
            (patient_id,),
        ).fetchall()
        return {row["category"]: bool(row["consented_bool"]) for row in rows}

    @staticmethod
    def _consent_version(connection: Any, patient_id: str) -> int:
        row = connection.execute(
            "SELECT COALESCE(MAX(version), 0) AS version FROM consent_flags WHERE patient_id = ?",
            (patient_id,),
        ).fetchone()
        return int(row["version"])

    def list_patients(self) -> list[dict[str, Any]]:
        with database(self.database_path) as connection:
            rows = connection.execute(
                """
                SELECT p.patient_id, p.name, p.dob
                FROM patients p
                JOIN doctor_patients dp ON dp.patient_id = p.patient_id
                WHERE dp.doctor_id = ? AND dp.active_to IS NULL
                ORDER BY CASE WHEN p.patient_id = 'pt-maria-conti' THEN 0 ELSE 1 END, p.name
                """,
                (self.doctor_id,),
            ).fetchall()
        return [
            {
                "patient_id": row["patient_id"],
                "name": row["name"],
                "age": _age(row["dob"]),
                "synthetic": True,
                "label": f"{row['name']} — Synthetic demo patient",
            }
            for row in rows
        ]

    def get_consent(self, patient_id: str) -> dict[str, Any]:
        with database(self.database_path) as connection:
            self._verify_scope(connection, patient_id)
            rows = connection.execute(
                """
                SELECT category, consented_bool, last_updated, version
                FROM consent_flags WHERE patient_id = ? ORDER BY category
                """,
                (patient_id,),
            ).fetchall()
            return {
                "patient_id": patient_id,
                "categories": {
                    row["category"]: {
                        "consented": bool(row["consented_bool"]),
                        "last_updated": row["last_updated"],
                        "version": row["version"],
                    }
                    for row in rows
                },
                "consent_version": self._consent_version(connection, patient_id),
                "synthetic": True,
            }

    def set_consent(self, patient_id: str, category: str, consented: bool) -> dict[str, Any]:
        if category not in {"general", "behavioral_health", "medications"}:
            raise ValueError("Unsupported consent category")
        with database(self.database_path) as connection:
            self._verify_scope(connection, patient_id)
            version = self._consent_version(connection, patient_id) + 1
            cursor = connection.execute(
                """
                UPDATE consent_flags
                SET consented_bool = ?, last_updated = datetime('now'), version = ?
                WHERE patient_id = ? AND category = ?
                """,
                (int(consented), version, patient_id, category),
            )
            if cursor.rowcount != 1:
                raise ValueError("Consent category is unavailable")
        return self.get_consent(patient_id)

    def get_patient_summary(self, patient_id: str) -> dict[str, Any]:
        with database(self.database_path) as connection:
            patient = self._verify_scope(connection, patient_id)
            consent = self._consent_map(connection, patient_id)
            version = self._consent_version(connection, patient_id)
            last_visit = connection.execute(
                """
                SELECT MAX(occurred_at) AS value FROM encounters
                WHERE patient_id = ? AND encounter_type != 'current_demo'
                """,
                (patient_id,),
            ).fetchone()["value"]
            conditions = []
            allergies = []
            if consent.get("general"):
                conditions = [
                    _row(row)
                    for row in connection.execute(
                        """
                        SELECT diagnosis_id AS id, display, diagnosed_on
                        FROM diagnoses WHERE patient_id = ? AND consent_category = 'general'
                        ORDER BY diagnosed_on DESC LIMIT 2
                        """,
                        (patient_id,),
                    ).fetchall()
                ]
                allergies = [
                    _row(row)
                    for row in connection.execute(
                        """
                        SELECT allergy_id AS id, display FROM allergies
                        WHERE patient_id = ? AND consent_category = 'general'
                        ORDER BY display LIMIT 5
                        """,
                        (patient_id,),
                    ).fetchall()
                ]
            return {
                "patient_id": patient_id,
                "name": patient["name"],
                "age": _age(patient["dob"]),
                "summary": patient["summary_text"] if consent.get("general") else None,
                "last_visit_date": last_visit,
                "conditions": conditions,
                "allergies": allergies,
                "consent_version": version,
                "synthetic": True,
                "label": "Synthetic demo patient",
            }

    def _history_sources(self, connection: Any, patient_id: str) -> list[dict[str, Any]]:
        consent = self._consent_map(connection, patient_id)
        sources: list[dict[str, Any]] = []

        encounter_rows = connection.execute(
            """
            SELECT encounter_id, occurred_at, title, soap_note_text, consent_category
            FROM encounters
            WHERE patient_id = ? AND encounter_type != 'current_demo'
            ORDER BY occurred_at ASC
            """,
            (patient_id,),
        ).fetchall()
        for item in encounter_rows:
            if not item["soap_note_text"] or not consent.get(item["consent_category"], False):
                continue
            sources.append(
                {
                    "id": f"note-{item['encounter_id']}",
                    "patient_id": patient_id,
                    "kind": "historical_note",
                    "title": item["title"],
                    "clinical_date": item["occurred_at"],
                    "date": item["occurred_at"],
                    "text": item["soap_note_text"],
                    "excerpt": item["soap_note_text"],
                    "speaker": "clinician",
                    "start_ms": None,
                    "end_ms": None,
                    "consent_category": item["consent_category"],
                    "documentation_status": "documented",
                    "synthetic": True,
                }
            )

        segment_rows = connection.execute(
            """
            SELECT ts.*, e.title, e.occurred_at
            FROM transcript_segments ts
            JOIN transcripts t ON t.transcript_id = ts.transcript_id
            JOIN encounters e ON e.encounter_id = t.encounter_id
            WHERE ts.patient_id = ? AND ts.is_final = 1
            ORDER BY e.occurred_at ASC, ts.start_ms ASC
            """,
            (patient_id,),
        ).fetchall()
        for item in segment_rows:
            if not consent.get(item["consent_category"], False):
                continue
            sources.append(
                {
                    "id": item["segment_id"],
                    "patient_id": patient_id,
                    "kind": "historical_transcript",
                    "title": item["title"],
                    "clinical_date": item["occurred_at"],
                    "date": item["occurred_at"],
                    "text": item["text"],
                    "excerpt": item["text"],
                    "speaker": item["speaker"],
                    "start_ms": item["start_ms"],
                    "end_ms": item["end_ms"],
                    "consent_category": item["consent_category"],
                    "documentation_status": item["documentation_status"],
                    "synthetic": True,
                }
            )

        observation_rows = connection.execute(
            """
            SELECT observation_id, observed_at, kind, value_num, value_text, unit,
                   consent_category
            FROM observations WHERE patient_id = ? ORDER BY observed_at ASC
            """,
            (patient_id,),
        ).fetchall()
        for item in observation_rows:
            if not consent.get(item["consent_category"], False):
                continue
            value = item["value_text"] or f"{item['value_num']:g} {item['unit'] or ''}".strip()
            sources.append(
                {
                    "id": item["observation_id"],
                    "patient_id": patient_id,
                    "kind": "structured_observation",
                    "title": item["kind"].replace("_", " ").title(),
                    "clinical_date": item["observed_at"],
                    "date": item["observed_at"],
                    "text": value,
                    "excerpt": value,
                    "speaker": None,
                    "start_ms": None,
                    "end_ms": None,
                    "consent_category": item["consent_category"],
                    "documentation_status": "documented",
                    "synthetic": True,
                }
            )
        return sources[: self.MAX_HISTORY_SOURCES]

    def get_patient_history(self, patient_id: str) -> dict[str, Any]:
        with database(self.database_path) as connection:
            self._verify_scope(connection, patient_id)
            sources = self._history_sources(connection, patient_id)
            encounters = [
                _row(row)
                for row in connection.execute(
                    """
                    SELECT encounter_id, occurred_at, encounter_type, title
                    FROM encounters WHERE patient_id = ? AND encounter_type != 'current_demo'
                    ORDER BY occurred_at ASC LIMIT 20
                    """,
                    (patient_id,),
                ).fetchall()
            ]
            return {
                "patient_id": patient_id,
                "encounters": encounters,
                "sources": sources,
                "consent_version": self._consent_version(connection, patient_id),
                "synthetic": True,
            }

    def get_recent_encounters(self, patient_id: str, n: int) -> dict[str, Any]:
        limit = max(1, min(n, self.MAX_RECENT))
        history = self.get_patient_history(patient_id)
        history["encounters"] = list(reversed(history["encounters"]))[:limit]
        allowed_dates = {item["occurred_at"] for item in history["encounters"]}
        history["sources"] = [
            source for source in history["sources"] if source["clinical_date"] in allowed_dates
        ]
        return history

    def search_patient_history(self, patient_id: str, query: str) -> dict[str, Any]:
        history = self.get_patient_history(patient_id)
        query_terms = _terms(query)
        ranked: list[tuple[int, dict[str, Any]]] = []
        for source in history["sources"]:
            score = len(query_terms.intersection(_terms(source["text"])))
            if score:
                ranked.append((score, source))
        ranked.sort(key=lambda item: (-item[0], item[1]["clinical_date"], item[1]["id"]))
        history["sources"] = [source for _, source in ranked[:15]]
        return history

    def search_my_patient_cohort(self, criteria: dict[str, Any]) -> dict[str, Any]:
        unexpected = set(criteria).difference(self.COHORT_KEYS)
        if unexpected:
            raise UnsupportedCohortCriteria(
                f"Unsupported cohort criteria: {', '.join(sorted(unexpected))}"
            )
        minimum_age = int(criteria.get("minimum_age", 50))
        diagnosis_query = str(criteria.get("diagnosis_code_or_display", "type 2 diabetes")).lower()
        diagnosed_since = str(criteria.get("diagnosed_since", "2024-09-26"))
        minimum_loss = float(criteria.get("minimum_weight_loss_percent", 5))
        limit = max(1, min(int(criteria.get("result_limit", 10)), self.MAX_COHORT_RESULTS))

        matches: list[dict[str, Any]] = []
        with database(self.database_path) as connection:
            rows = connection.execute(
                """
                SELECT p.patient_id, p.name, p.dob, d.diagnosis_id, d.display,
                       d.code, d.diagnosed_on
                FROM patients p
                JOIN doctor_patients dp ON dp.patient_id = p.patient_id
                JOIN diagnoses d ON d.patient_id = p.patient_id
                JOIN consent_flags cf ON cf.patient_id = p.patient_id
                  AND cf.category = d.consent_category AND cf.consented_bool = 1
                WHERE dp.doctor_id = ? AND dp.active_to IS NULL
                  AND d.diagnosed_on >= ?
                  AND (LOWER(d.display) LIKE ? OR LOWER(d.code) = ?)
                ORDER BY p.name
                """,
                (
                    self.doctor_id,
                    diagnosed_since,
                    f"%{diagnosis_query}%",
                    diagnosis_query,
                ),
            ).fetchall()
            for item in rows:
                patient_age = _age(item["dob"])
                if patient_age < minimum_age:
                    continue
                consent = self._consent_map(connection, item["patient_id"])
                if not consent.get("general", False):
                    continue
                weights = connection.execute(
                    """
                    SELECT observation_id, observed_at, value_num
                    FROM observations
                    WHERE patient_id = ? AND kind = 'weight' AND consent_category = 'general'
                    ORDER BY observed_at ASC
                    """,
                    (item["patient_id"],),
                ).fetchall()
                if len(weights) < 2 or not weights[0]["value_num"]:
                    continue
                baseline, latest = weights[0], weights[-1]
                loss = (baseline["value_num"] - latest["value_num"]) / baseline["value_num"] * 100
                if loss < minimum_loss:
                    continue
                matches.append(
                    {
                        "patient_id": item["patient_id"],
                        "display_name": item["name"],
                        "age": patient_age,
                        "diagnosis_date": item["diagnosed_on"],
                        "baseline_weight_kg": baseline["value_num"],
                        "baseline_date": baseline["observed_at"],
                        "latest_weight_kg": latest["value_num"],
                        "latest_date": latest["observed_at"],
                        "weight_loss_percent": round(loss, 1),
                        "source_ids": [
                            item["diagnosis_id"],
                            baseline["observation_id"],
                            latest["observation_id"],
                        ],
                    }
                )
        return {
            "criteria": criteria,
            "matches": matches[:limit],
            "consent_version": max(
                (self.get_consent(match["patient_id"])["consent_version"] for match in matches),
                default=0,
            ),
            "synthetic": True,
        }
