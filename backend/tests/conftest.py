from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import pytest

from app import config, db
from app.chat import GroundedChat
from app.records import PatientRecordService


@pytest.fixture()
def database_path(tmp_path: Path) -> Path:
    target = tmp_path / "test.sqlite3"
    db.seed(target, config.settings.fixture_path)
    return target


@pytest.fixture()
def records(database_path: Path) -> PatientRecordService:
    return PatientRecordService(database_path=database_path)


@pytest.fixture()
def api_client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    from fastapi.testclient import TestClient
    from app import main

    target = tmp_path / "api.sqlite3"
    test_settings = replace(config.settings, database_path=target, bte_mode="off")
    monkeypatch.setattr(db, "settings", test_settings)
    monkeypatch.setattr(main, "settings", test_settings)
    test_records = PatientRecordService(database_path=target)
    monkeypatch.setattr(main, "records", test_records)
    monkeypatch.setattr(main, "chat", GroundedChat(test_records, tmp_path / "bte-cache.json"))
    with TestClient(main.app) as client:
        yield client
