from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import FastMCP

from .records import PatientRecordService


mcp = FastMCP("Mock Patient Record")
records = PatientRecordService()


@mcp.tool()
def get_patient_summary(patient_id: str) -> dict[str, Any]:
    """Return a consent-filtered thin summary for one assigned synthetic patient."""
    return records.get_patient_summary(patient_id)


@mcp.tool()
def get_patient_history(patient_id: str) -> dict[str, Any]:
    """Return dated consent-filtered history for one assigned synthetic patient."""
    return records.get_patient_history(patient_id)


@mcp.tool()
def get_recent_encounters(patient_id: str, n: int = 3) -> dict[str, Any]:
    """Return a clamped number of recent encounters for one assigned patient."""
    return records.get_recent_encounters(patient_id, n)


@mcp.tool()
def search_patient_history(patient_id: str, query: str) -> dict[str, Any]:
    """Lexically search permitted notes and final transcript segments."""
    return records.search_patient_history(patient_id, query)


@mcp.tool()
def search_my_patient_cohort(criteria: dict[str, Any]) -> dict[str, Any]:
    """Apply the allow-listed structured cohort search to the trusted doctor's panel."""
    return records.search_my_patient_cohort(criteria)


if __name__ == "__main__":
    mcp.run(transport="stdio")
