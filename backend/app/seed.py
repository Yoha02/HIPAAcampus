from __future__ import annotations

import argparse

from .config import settings
from .db import seed, validate_fixture
import json


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the synthetic HIPAcampus SQLite database")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    if args.validate_only:
        validate_fixture(json.loads(settings.fixture_path.read_text()))
        print(f"Validated synthetic fixture: {settings.fixture_path}")
        return
    target = seed()
    print(f"Seeded synthetic demo database: {target}")


if __name__ == "__main__":
    main()
