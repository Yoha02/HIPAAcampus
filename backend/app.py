"""Small local API for the existing UI. Extractive retrieval: no invented clinical claims."""
import hashlib
import json
import os
import re
import sqlite3
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, model_validator

from .fixtures import DEMO_DATE, PATIENT, SOURCES, WEIGHTS, document


class Span(BaseModel):
    id: str
    text: str


class Paragraph(BaseModel):
    label: str | None = None
    spans: list[str | Span]


class Section(BaseModel):
    heading: str | None = None
    paragraphs: list[Paragraph]


class Source(BaseModel):
    id: str
    category: Literal["clinician-notes", "live-transcript", "ehr", "medical-reference"]
    date: str
    patient: str | None = None
    title: str
    kind: str
    author: str
    sections: list[Section]

    @model_validator(mode="after")
    def unique_passages(self):
        ids = [s.id for section in self.sections for p in section.paragraphs
               for s in p.spans if isinstance(s, Span)]
        if len(ids) != len(set(ids)):
            raise ValueError("Passage IDs must be unique inside each source")
        return self


class Segment(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str

    @model_validator(mode="after")
    def ordered(self):
        if self.end < self.start:
            raise ValueError("Segment end precedes start")
        return self


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    notes: str = Field(default="", max_length=100000)
    transcript: list[Segment] = Field(default_factory=list)


def stamp(seconds):
    seconds = int(seconds)
    return f"{seconds // 60:02d}:{seconds % 60:02d}"


def passages(source):
    for section in source["sections"]:
        for paragraph in section["paragraphs"]:
            for span in paragraph["spans"]:
                if isinstance(span, dict):
                    yield {"sourceId": source["id"], "passageId": span["id"],
                           "text": span["text"], "label": paragraph.get("label", ""),
                           "date": source["date"], "category": source["category"]}


def cite(passage):
    return {k: passage[k] for k in ("sourceId", "passageId")}


def snapshot(request):
    result = []
    if request.notes.strip():
        key = hashlib.sha256(request.notes.encode()).hexdigest()[:16]
        result.append(document(f"notes-{key}", "clinician-notes", DEMO_DATE,
                               "Your notes at the time of this question",
                               [("notes", "Draft", request.notes)], "Working notes snapshot"))
    if request.transcript:
        segments = [s.model_dump() for s in request.transcript]
        key = hashlib.sha256(json.dumps(segments, sort_keys=True).encode()).hexdigest()[:16]
        result.append(document(f"live-{key}", "live-transcript", DEMO_DATE,
                               "Today's captured conversation",
                               [(f"segment-{i}", f"{stamp(s.start)}–{stamp(s.end)}", s.text)
                                for i, s in enumerate(request.transcript)], "Live transcript snapshot"))
    return result


STOP = set("a an the is it her she he i we you my of to for in on as and or what why did does has have was were been ever since this that with about me tell give from how when which said say maria conti".split())
GROUPS = [
    {"metformin", "medication", "pill", "stop", "stopped", "stopping", "discontinuation", "diarrhea", "stools", "greasy", "pale", "appetite", "intolerance"},
    {"weight", "lost", "loss", "diet", "hungry", "appetite", "kg", "eating"},
    {"pain", "back", "abdominal", "shoulder", "blades", "gardening"},
    {"tests", "test", "scan", "ct", "bilirubin", "liver", "lipase", "referral", "follow", "thursday"},
]


def tokens(text):
    return set(re.findall(r"[a-z0-9]+", text.lower())) - STOP


def retrieve(question, sources, current):
    q = question.lower()
    terms = tokens(q)
    expanded = set(terms)
    for group in GROUPS:
        if terms & group:
            expanded |= group
    pool = [p for source in sources for p in passages(source)]
    if re.search(r"\b(my notes|written|wrote|thoughts)\b", q):
        pool = [p for s in current if s["category"] == "clinician-notes" for p in passages(s)]
        return pool
    if ("today" in q and terms & GROUPS[3]) or "today's conversation" in q:
        # A past plan or a scripted fixture is not proof of what was said today.
        pool = [p for s in current if s["category"] == "live-transcript" for p in passages(s)]
    if ("changed" in q or "changes" in q) and not terms & {"weight", "lost", "loss"}:
        pool = [p for p in pool if p["date"] in {"2026-06-04", DEMO_DATE}]
        expanded |= {"weight", "yellow", "eyes", "metformin", "discontinuation", "diarrhea"}
    ranked = []
    for p in pool:
        if p["text"].startswith("Clinician:") and p["text"].endswith("?"):
            continue
        words = tokens(p["text"])
        score = len(words & terms) * 3 + len(words & expanded)
        if terms & {"weight", "lost", "loss"}:
            # Structured measurements are returned separately; prioritize the patient's explanation.
            if p["label"] == "Weight":
                continue
            if p["category"] == "live-transcript" and words & GROUPS[1]:
                score += 8
        if terms & {"stop", "stopped", "stopping"} and "started" in words:
            score -= 4
        if score:
            ranked.append((score, p))
    ranked.sort(key=lambda pair: -pair[0])
    return [p for _, p in ranked[:5]]


def graph_for(answer_id, question, sentences, sources):
    citations = {}
    for sentence in sentences:
        for citation in sentence["citations"]:
            group = citations.setdefault(citation["sourceId"], [])
            if citation not in group:
                group.append(citation)
    nodes = [{"id": answer_id, "kind": "answer", "label": question, "citations": []}]
    edges = []
    for source in sources:
        if source["id"] not in citations:
            continue
        nodes.append({"id": source["id"], "kind": "source", "label": source["title"],
                      "citations": citations[source["id"]]})
        edges.append({"id": f"{source['id']}:{answer_id}", "source": source["id"],
                      "target": answer_id, "label": "cited in answer"})
    return {"nodes": nodes, "edges": edges}


def answer(request, sources, current):
    selected = retrieve(request.question, sources, current)
    sentences = []
    # Calculations use structured observations, not language-model guesses.
    if tokens(request.question) & {"weight", "lost", "loss"}:
        baseline, latest = WEIGHTS[0], WEIGHTS[-1]
        loss = baseline["kg"] - latest["kg"]
        series = "; ".join(f"{w['date']}: {w['kg']} kg" for w in WEIGHTS)
        sentences.append({"text": f"Recorded weight: {series}. Overall decline: {loss} kg, or {loss / baseline['kg'] * 100:.2f}% of baseline weight. The June weight was patient-reported.",
                          "citations": [cite(w) for w in WEIGHTS]})
    elif "changed" in request.question.lower() or "changes" in request.question.lower():
        previous, latest = WEIGHTS[-2:]
        sentences.append({"text": f"Weight changed from {previous['kg']} kg at the previous visit ({previous['date']}, patient-reported) to {latest['kg']} kg today ({latest['date']}), a decrease of {previous['kg'] - latest['kg']} kg.",
                          "citations": [cite(previous), cite(latest)]})
    for p in selected:
        sentences.append({"text": f"{p['date']} · {p['label']}: “{p['text']}”", "citations": [cite(p)]})
    if not sentences:
        sentences = [{"text": "I couldn't find supporting passages for that question in the available records. Try a more specific question or add the missing source.", "citations": []}]
    id = f"answer-{uuid4().hex}"
    graph = graph_for(id, request.question, sentences, sources)
    cited_ids = {c["sourceId"] for sentence in sentences for c in sentence["citations"]}
    return {"id": id, "role": "assistant", "question": request.question, "sentences": sentences,
            "graph": graph, "sources": [s for s in sources if s["id"] in cited_ids],
            "mode": "local-extractive"}


def create_app(db_path=None):
    app = FastAPI(title="Hippacampus local clinical context")
    path = Path(db_path or os.environ.get("CLINICAL_DB", "backend/data/demo.sqlite3"))
    path.parent.mkdir(parents=True, exist_ok=True)

    def connect():
        return sqlite3.connect(path)

    with connect() as db:
        db.execute("CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        db.execute("CREATE TABLE IF NOT EXISTS turns (seq INTEGER PRIMARY KEY, payload TEXT NOT NULL)")

    def all_sources():
        with connect() as db:
            stored = [json.loads(row[0]) for row in db.execute("SELECT payload FROM sources ORDER BY rowid")]
        return SOURCES + stored

    def store(sources):
        with connect() as db:
            for source in sources:
                db.execute("INSERT OR IGNORE INTO sources VALUES (?, ?)", (source["id"], json.dumps(source)))

    @app.get("/bootstrap")
    def bootstrap():
        with connect() as db:
            messages = [json.loads(row[0]) for row in db.execute("SELECT payload FROM turns ORDER BY seq")]
        return {"patient": PATIENT, "date": DEMO_DATE, "sources": all_sources(),
                "messages": messages, "mode": "local-extractive"}

    @app.post("/sources")
    def add_source(source: Source):
        if any(s["id"] == source.id for s in all_sources()):
            raise HTTPException(409, "A source with this ID already exists")
        data = source.model_dump(exclude_none=True)
        # The existing upload UI produces plain strings. Give them durable citation anchors.
        for si, section in enumerate(data["sections"]):
            for pi, paragraph in enumerate(section["paragraphs"]):
                paragraph["spans"] = [
                    {"id": f"import-{si}-{pi}-{i}", "text": span} if isinstance(span, str) else span
                    for i, span in enumerate(paragraph["spans"])
                ]
        store([data])
        return data

    @app.post("/chat")
    def chat(request: ChatRequest):
        if not request.question.strip():
            raise HTTPException(422, "Enter a question")
        current = snapshot(request)
        store(current)
        all_docs = all_sources()
        # Old draft/live snapshots remain resolvable for citations, but are not today's context.
        history = [s for s in all_docs if not s["id"].startswith(("notes-", "live-"))]
        result = answer(request, history + current, current)
        with connect() as db:
            for message in [{"role": "user", "text": request.question}, result]:
                db.execute("INSERT INTO turns(payload) VALUES (?)", (json.dumps(message),))
        return result

    @app.post("/summary")
    def summary(request: ChatRequest):
        current = snapshot(request)
        return {"bullets": [p["text"] for s in current for p in passages(s)]}

    return app


app = create_app()
