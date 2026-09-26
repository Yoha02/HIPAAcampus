from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    database_path: Path = Path(
        os.getenv("HIPACAMPUS_DB_PATH", BACKEND_DIR / "data" / "hipacampus.sqlite3")
    )
    fixture_path: Path = Path(
        os.getenv(
            "HIPACAMPUS_FIXTURE_PATH",
            BACKEND_DIR / "fixtures" / "synthetic_records.json",
        )
    )
    doctor_id: str = os.getenv("HIPACAMPUS_DOCTOR_ID", "doc-nguyen")
    model_mode: str = os.getenv("HIPACAMPUS_MODEL_MODE", "local")
    bedrock_model_id: str | None = os.getenv("BEDROCK_MODEL_ID")
    aws_region: str = os.getenv("AWS_REGION", "us-west-2")
    bte_mode: str = os.getenv("HIPACAMPUS_BTE_MODE", "live")
    bte_url: str = os.getenv("BTE_TRAPI_URL", "https://api.bte.ncats.io/v1/query")
    bte_api_key: str | None = os.getenv("BTE_API_KEY")


settings = Settings()
