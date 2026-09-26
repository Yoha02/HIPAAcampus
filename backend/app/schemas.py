from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SessionCreate(BaseModel):
    patient_id: str


class NotesUpdate(BaseModel):
    notes_text: str = Field(max_length=50_000)


class TranscriptSegmentInput(BaseModel):
    id: str
    speaker: str = "conversation"
    start_ms: int = Field(ge=0)
    end_ms: int = Field(ge=0)
    text: str = Field(max_length=10_000)
    is_final: bool = True


class TranscriptUpdate(BaseModel):
    segments: list[TranscriptSegmentInput] = Field(max_length=500)


class InsightsRequest(BaseModel):
    notes_text: str = Field(default="", max_length=50_000)
    transcript_segments: list[TranscriptSegmentInput] = Field(default_factory=list, max_length=500)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4_000)
    notes_text: str = Field(default="", max_length=50_000)
    transcript_segments: list[TranscriptSegmentInput] = Field(default_factory=list, max_length=500)


class ConsentUpdate(BaseModel):
    consented: bool


class TaskCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1_000)
    due_date: str | None = None


class CohortCriteria(BaseModel):
    model_config = ConfigDict(extra="forbid")

    minimum_age: int = Field(default=50, ge=0, le=120)
    diagnosis_code_or_display: str = Field(default="type 2 diabetes", max_length=100)
    diagnosed_since: str = "2024-09-26"
    minimum_weight_loss_percent: float = Field(default=5, ge=0, le=100)
    result_limit: int = Field(default=10, ge=1, le=10)


class Claim(BaseModel):
    id: str
    text: str
    source_ids: list[str]


class GraphNode(BaseModel):
    id: str
    kind: str
    label: str


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str


class Graph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ChatResponse(BaseModel):
    answer_id: str
    status: Literal["completed", "insufficient_evidence", "failed"]
    answer: str
    claims: list[Claim]
    sources: list[dict[str, Any]]
    graph: Graph
    consent_version: int
    knowledge_status: Literal[
        "live", "cached", "mocked", "unavailable", "no_match", "not_requested"
    ]
    limitations: list[str]
    task: dict[str, Any] | None = None
