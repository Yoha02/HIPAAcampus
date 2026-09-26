from __future__ import annotations

import pytest

from app.records import (
    PatientRecordService,
    RecordUnavailableError,
    UnsupportedCohortCriteria,
)


def test_patient_and_doctor_isolation(records: PatientRecordService) -> None:
    assert records.get_patient_summary("pt-maria-conti")["name"] == "Maria Conti"
    with pytest.raises(RecordUnavailableError, match="unavailable"):
        records.get_patient_summary("pt-nora-ellis")
    with pytest.raises(RecordUnavailableError, match="unavailable"):
        records.get_patient_history("not-a-patient")


def test_history_excludes_nonfinal_segments_and_clamps_recent(
    records: PatientRecordService,
) -> None:
    history = records.get_patient_history("pt-maria-conti")
    source_ids = {source["id"] for source in history["sources"]}
    assert "seg-maria-june-0412" in source_ids
    assert "seg-maria-june-partial" not in source_ids
    assert len(records.get_recent_encounters("pt-maria-conti", 999)["encounters"]) <= 10


def test_consent_change_applies_to_next_call(records: PatientRecordService) -> None:
    before = records.search_patient_history("pt-maria-conti", "metformin diarrhea")
    assert "seg-maria-june-0412" in {source["id"] for source in before["sources"]}
    old_version = before["consent_version"]

    changed = records.set_consent("pt-maria-conti", "medications", False)
    assert changed["consent_version"] > old_version
    after = records.search_patient_history("pt-maria-conti", "metformin diarrhea")
    after_ids = {source["id"] for source in after["sources"]}
    assert "seg-maria-june-0412" not in after_ids
    assert "note-enc-maria-june-2026" not in after_ids


def test_allowlisted_cohort_is_scoped_and_calculated(records: PatientRecordService) -> None:
    result = records.search_my_patient_cohort(
        {
            "minimum_age": 50,
            "diagnosis_code_or_display": "type 2 diabetes",
            "diagnosed_since": "2024-09-26",
            "minimum_weight_loss_percent": 5,
            "result_limit": 999,
        }
    )
    ids = {match["patient_id"] for match in result["matches"]}
    assert ids == {"pt-maria-conti", "pt-james-wu"}
    assert "pt-nora-ellis" not in ids
    maria = next(match for match in result["matches"] if match["patient_id"] == "pt-maria-conti")
    assert maria["weight_loss_percent"] == 15.4
    assert len(result["matches"]) <= 10

    with pytest.raises(UnsupportedCohortCriteria):
        records.search_my_patient_cohort({"free_text": "show every patient"})
