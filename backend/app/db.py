from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from .config import settings


TABLE_ORDER = [
    "doctors",
    "patients",
    "doctor_patients",
    "encounters",
    "transcripts",
    "transcript_segments",
    "diagnoses",
    "observations",
    "medication_events",
    "allergies",
    "consent_flags",
]


def connect(path: Path | None = None) -> sqlite3.Connection:
    target = path or settings.database_path
    target.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(target)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def database(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    connection = connect(path)
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize(path: Path | None = None) -> None:
    schema = (Path(__file__).parent / "schema.sql").read_text()
    with database(path) as connection:
        connection.executescript(schema)


def _insert_rows(connection: sqlite3.Connection, table: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    columns = list(rows[0])
    placeholders = ", ".join("?" for _ in columns)
    sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
    connection.executemany(sql, [[row.get(column) for column in columns] for row in rows])


def seed(path: Path | None = None, fixture_path: Path | None = None) -> Path:
    target = path or settings.database_path
    fixture = fixture_path or settings.fixture_path
    payload = json.loads(fixture.read_text())
    validate_fixture(payload)
    if target.exists():
        target.unlink()
    initialize(target)
    with database(target) as connection:
        for table in TABLE_ORDER:
            _insert_rows(connection, table, payload.get(table, []))
    return target


def validate_fixture(payload: dict[str, Any]) -> None:
    required = set(TABLE_ORDER)
    missing = required.difference(payload)
    if missing:
        raise ValueError(f"Fixture is missing tables: {sorted(missing)}")

    identifiers: dict[str, set[str]] = {}
    primary_keys = {
        "doctors": "doctor_id",
        "patients": "patient_id",
        "encounters": "encounter_id",
        "transcripts": "transcript_id",
        "transcript_segments": "segment_id",
        "diagnoses": "diagnosis_id",
        "observations": "observation_id",
        "medication_events": "medication_event_id",
        "allergies": "allergy_id",
    }
    for table, key in primary_keys.items():
        values = [row[key] for row in payload[table]]
        if len(values) != len(set(values)):
            raise ValueError(f"Duplicate {key} in {table}")
        identifiers[table] = set(values)

    if len(payload["patients"]) < 15:
        raise ValueError("The demo fixture must contain at least 15 patients")
    if any(row["synthetic_bool"] != 1 for row in payload["patients"]):
        raise ValueError("Every fixture patient must be explicitly synthetic")

    doctor_ids = identifiers["doctors"]
    patient_ids = identifiers["patients"]
    encounter_ids = identifiers["encounters"]
    transcript_ids = identifiers["transcripts"]
    allowed_categories = {"general", "behavioral_health", "medications"}

    for row in payload["doctor_patients"]:
        if row["doctor_id"] not in doctor_ids or row["patient_id"] not in patient_ids:
            raise ValueError("Invalid doctor-patient assignment")
    for row in payload["encounters"]:
        if row["patient_id"] not in patient_ids or row["doctor_id"] not in doctor_ids:
            raise ValueError(f"Invalid encounter relationship: {row['encounter_id']}")
    for row in payload["transcripts"]:
        if row["encounter_id"] not in encounter_ids or row["patient_id"] not in patient_ids:
            raise ValueError(f"Invalid transcript relationship: {row['transcript_id']}")
    for row in payload["transcript_segments"]:
        if row["transcript_id"] not in transcript_ids or row["patient_id"] not in patient_ids:
            raise ValueError(f"Invalid transcript segment relationship: {row['segment_id']}")
        if row["end_ms"] < row["start_ms"] or row["is_final"] not in (0, 1):
            raise ValueError(f"Invalid transcript timing/finality: {row['segment_id']}")
        if row["consent_category"] not in allowed_categories:
            raise ValueError(f"Invalid consent category: {row['segment_id']}")
    for table in ("diagnoses", "observations", "medication_events"):
        for row in payload[table]:
            if row["encounter_id"] not in encounter_ids or row["patient_id"] not in patient_ids:
                raise ValueError(f"Invalid relationship in {table}")
            if row["consent_category"] not in allowed_categories:
                raise ValueError(f"Invalid consent category in {table}")

    maria = next((row for row in payload["patients"] if row["patient_id"] == "pt-maria-conti"), None)
    if not maria or maria["name"] != "Maria Conti":
        raise ValueError("Canonical Maria Conti fixture is missing")
