import copy

import pytest
from fastapi.testclient import TestClient

from backend.app import ChatRequest, answer, create_app, passages
from backend.fixtures import SOURCES


@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(tmp_path / "demo.sqlite3"))


def ask(client, question, **context):
    response = client.post("/chat", json={"question": question, **context})
    assert response.status_code == 200, response.text
    return response.json()


def cited(reply):
    return {(c["sourceId"], c["passageId"]) for s in reply["sentences"] for c in s["citations"]}


def test_medication_reveal_and_sparse_ehr(client):
    reply = ask(client, "Why did she stop metformin?")
    assert {("call-june", id) for id in ["stopped-metformin", "stool-description", "persistent-symptoms"]} <= cited(reply)
    ehr = next(s for s in reply["sources"] if s["id"] == "ehr-june")
    assert "greasy" not in str(ehr)
    assert "pancreatic" not in str(reply).lower()


@pytest.mark.parametrize("question", [
    "Why did she stop metformin?", "Has her weight changed, and did she say why?",
    "Did she ever mention back or abdominal pain?", "What's changed since her last visit?",
    "What did I tell her today about the tests?", "What is in my notes?", "What is her occupation?",
])
def test_every_citation_and_graph_edge_resolves(client, question):
    reply = ask(client, question)
    available = {(p["sourceId"], p["passageId"]) for s in reply["sources"] for p in passages(s)}
    assert cited(reply) <= available
    nodes = {n["id"] for n in reply["graph"]["nodes"]}
    for edge in reply["graph"]["edges"]:
        assert edge["source"] in nodes and edge["target"] in nodes
    graph_citations = {(c["sourceId"], c["passageId"]) for n in reply["graph"]["nodes"] for c in n["citations"]}
    assert graph_citations == cited(reply)


def test_weight_calculation_and_patient_explanation(client):
    reply = ask(client, "Has her weight changed, and did she say why?")
    assert "15.38%" in str(reply)
    assert "12 kg" in str(reply)
    assert ("call-february", "diet") in cited(reply)
    assert ("call-february", "appetite") in cited(reply)


def test_back_pain_is_not_relabelled_abdominal(client):
    reply = ask(client, "Did she ever mention back or abdominal pain?")
    assert ("call-june", "back-pain") in cited(reply)
    assert "between my shoulder blades" in str(reply)


def test_no_unspoken_plan_and_completed_speech_is_used(client):
    empty = ask(client, "What did I tell her today about the tests?")
    assert not cited(empty)
    reply = ask(client, "What did I tell her today about the tests?", transcript=[
        {"start": 5, "end": 12, "text": "I will request the scan and check the bilirubin results on Thursday."},
    ])
    assert "Thursday" in str(reply)
    assert all(source.startswith("live-") for source, _ in cited(reply))


def test_note_snapshots_are_immutable_and_old_notes_not_retrieved(client):
    first = ask(client, "What is in my notes?", notes="Review tomorrow.")
    second = ask(client, "What is in my notes?", notes="Review next week.")
    assert cited(first) != cited(second)
    assert "tomorrow" not in str(second)
    documents = client.get("/bootstrap").json()["sources"]
    first_id = next(iter(cited(first)))[0]
    assert "tomorrow" in str(next(s for s in documents if s["id"] == first_id))


def test_fixture_change_changes_extracted_answer():
    changed = copy.deepcopy(SOURCES)
    source = next(s for s in changed if s["id"] == "call-june")
    for paragraph in source["sections"][0]["paragraphs"]:
        for span in paragraph["spans"]:
            if span["id"] == "stool-description":
                span["text"] = "Maria: The stools were greasy with a revised synthetic observation."
    reply = answer(ChatRequest(question="Why did she stop metformin?"), changed, [])
    assert "revised synthetic observation" in str(reply)
    assert "hard to flush" not in str(reply)


def test_uploaded_source_persists_and_is_citable(client):
    added = copy.deepcopy(SOURCES[0])
    added["id"] = "uploaded-demo"
    added["sections"] = [{"paragraphs": [{"spans": ["Maria enjoys watercolour painting."]}]}]
    assert client.post("/sources", json=added).status_code == 200
    reply = ask(client, "Does Maria enjoy watercolour painting?")
    assert ("uploaded-demo", "import-0-0-0") in cited(reply)
    assert client.post("/sources", json=added).status_code == 409


def test_summary_never_uses_historical_fixture_as_live_speech(client):
    assert client.post("/summary", json={"question": "summary"}).json() == {"bullets": []}


def test_history_survives_backend_restart(tmp_path):
    path = tmp_path / "persist.sqlite3"
    ask(TestClient(create_app(path)), "What is in my notes?", notes="Check captured speech.")
    session = TestClient(create_app(path)).get("/bootstrap").json()
    assert len(session["messages"]) == 2


def test_invalid_time_and_empty_question(client):
    assert client.post("/chat", json={"question": "   "}).status_code == 422
    assert client.post("/chat", json={"question": "tests", "transcript": [{"start": 9, "end": 2, "text": "x"}]}).status_code == 422
