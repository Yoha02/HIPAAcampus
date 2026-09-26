from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any

from .providers import BioThingsExplorer
from .records import PatientRecordService
from .schemas import ChatResponse, Claim, Graph, GraphEdge, GraphNode


def _source_index(sources: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {source["id"]: source for source in sources}


def _graph(claims: list[Claim], sources: list[dict[str, Any]]) -> Graph:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    source_lookup = _source_index(sources)
    for claim in claims[:3]:
        nodes.append(GraphNode(id=claim.id, kind="claim", label=claim.text[:58]))
        for source_id in claim.source_ids[:2]:
            if source_id not in source_lookup:
                continue
            if all(node.id != source_id for node in nodes) and len(nodes) < 8:
                source = source_lookup[source_id]
                nodes.append(
                    GraphNode(
                        id=source_id,
                        kind=source["kind"],
                        label=f"{source['date']} {source['title']}"[:58],
                    )
                )
            if len(edges) < 10:
                edges.append(GraphEdge(source=claim.id, target=source_id, type="supported_by"))
    return Graph(nodes=nodes[:8], edges=edges[:10])


def _claim(number: int, text: str, source_ids: list[str]) -> Claim:
    return Claim(id=f"claim-{number}", text=text, source_ids=source_ids)


class GroundedChat:
    def __init__(self, records: PatientRecordService, cache_path: Path):
        self.records = records
        self.bte = BioThingsExplorer(cache_path)

    @staticmethod
    def current_sources(
        patient_id: str,
        notes_text: str,
        transcript_segments: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        sources: list[dict[str, Any]] = []
        if notes_text.strip():
            sources.append(
                {
                    "id": "current-note",
                    "patient_id": patient_id,
                    "kind": "current_note",
                    "title": "Current consultation note",
                    "clinical_date": "2026-09-26",
                    "date": "2026-09-26",
                    "text": notes_text.strip(),
                    "excerpt": notes_text.strip(),
                    "speaker": "clinician",
                    "start_ms": None,
                    "end_ms": None,
                    "consent_category": "general",
                    "documentation_status": "documented",
                    "synthetic": True,
                }
            )
        for segment in transcript_segments:
            if not segment.get("is_final", False) or not segment.get("text", "").strip():
                continue
            sources.append(
                {
                    "id": f"live-{segment['id']}",
                    "patient_id": patient_id,
                    "kind": "current_transcript",
                    "title": "Current consultation transcript",
                    "clinical_date": "2026-09-26",
                    "date": "2026-09-26",
                    "text": segment["text"].strip(),
                    "excerpt": segment["text"].strip(),
                    "speaker": segment.get("speaker", "conversation"),
                    "start_ms": segment["start_ms"],
                    "end_ms": segment["end_ms"],
                    "consent_category": "general",
                    "documentation_status": "spoken_only",
                    "synthetic": True,
                }
            )
        return sources

    async def answer(
        self,
        patient_id: str,
        question: str,
        notes_text: str,
        transcript_segments: list[dict[str, Any]],
    ) -> ChatResponse:
        lowered = question.lower().strip()
        history = self.records.get_patient_history(patient_id)
        current = self.current_sources(patient_id, notes_text, transcript_segments)
        sources = history["sources"] + current
        index = _source_index(sources)
        claims: list[Claim] = []
        answer = ""
        status: str = "completed"
        knowledge_status = "not_requested"
        limitations = ["Synthetic demo records only; no diagnosis was inferred."]
        task: dict[str, Any] | None = None

        def has(source_id: str) -> bool:
            return source_id in index

        if "which of my patients" in lowered or (
            "over 50" in lowered and "diabetes" in lowered and "weight" in lowered
        ):
            result = self.records.search_my_patient_cohort(
                {
                    "minimum_age": 50,
                    "diagnosis_code_or_display": "type 2 diabetes",
                    "diagnosed_since": "2024-09-26",
                    "minimum_weight_loss_percent": 5,
                    "result_limit": 10,
                }
            )
            sources = []
            rows = []
            for match in result["matches"]:
                source_id = f"cohort-{match['patient_id']}"
                text = (
                    f"{match['display_name']}: {match['baseline_weight_kg']:g} kg on "
                    f"{match['baseline_date']} to {match['latest_weight_kg']:g} kg on "
                    f"{match['latest_date']} ({match['weight_loss_percent']:.1f}% loss); "
                    f"type 2 diabetes diagnosed {match['diagnosis_date']}."
                )
                source = {
                    "id": source_id,
                    "patient_id": match["patient_id"],
                    "kind": "cohort_calculation",
                    "title": "Doctor-panel cohort calculation",
                    "clinical_date": match["latest_date"],
                    "date": match["latest_date"],
                    "text": text,
                    "excerpt": text,
                    "speaker": None,
                    "start_ms": None,
                    "end_ms": None,
                    "consent_category": "general",
                    "documentation_status": "documented",
                    "synthetic": True,
                    "calculation_source_ids": match["source_ids"],
                }
                sources.append(source)
                rows.append(
                    f"{match['display_name']} (age {match['age']}): "
                    f"{match['baseline_weight_kg']:g} → {match['latest_weight_kg']:g} kg, "
                    f"{match['weight_loss_percent']:.1f}% loss"
                )
                claims.append(_claim(len(claims) + 1, rows[-1], [source_id]))
            if rows:
                answer = (
                    "Within Dr. Nguyen’s active synthetic patient panel, the allow-listed "
                    "structured search found:\n\n- " + "\n- ".join(rows)
                )
            else:
                answer = "No patients in the current doctor’s permitted synthetic panel matched."
                status = "insufficient_evidence"
            limitations.append("Cohort search is limited to the current doctor and fixed filters.")
        elif "why" in lowered and "metformin" in lowered:
            medication_ids = [
                source_id
                for source_id in (
                    "seg-maria-june-0412",
                    "note-enc-maria-june-2026",
                )
                if has(source_id)
            ]
            if not medication_ids:
                answer = (
                    "That information is unavailable under the current consent settings. "
                    "No medication-category details were used."
                )
                status = "insufficient_evidence"
                sources = current
                limitations.append("Medication evidence is withheld by current consent.")
            else:
                answer = (
                    "Maria said she stopped metformin in mid-May because she associated it with "
                    "diarrhea. In the June 4 call she described greasy, pale, floating stools that "
                    "were hard to flush and said the diarrhea persisted for two weeks after stopping; "
                    "she also reported reduced appetite. The written note records only “GI "
                    "intolerance,” so the detailed account is spoken-only evidence."
                )
                claims = [
                    _claim(
                        1,
                        "Maria associated stopping metformin with diarrhea.",
                        ["seg-maria-june-0412"],
                    ),
                    _claim(
                        2,
                        "The detailed stool description and persistence after stopping were spoken in the June 4 call.",
                        ["seg-maria-june-0412"],
                    ),
                    _claim(
                        3,
                        "The note documented only “GI intolerance.”",
                        ["note-enc-maria-june-2026"],
                    ),
                ]
                sources = [index[source_id] for source_id in medication_ids]
        elif "weight" in lowered and ("changed" in lowered or "change" in lowered):
            ids = [
                source_id
                for source_id in (
                    "obs-maria-weight-2025",
                    "obs-maria-weight-current",
                    "seg-maria-feb-diet",
                )
                if has(source_id)
            ]
            if len(ids) >= 2:
                answer = (
                    "Maria’s recorded weight changed from 78 kg on October 10, 2025 to 66 kg "
                    "today—a loss of 12 kg, or 15.4%. In February she attributed the loss to diet "
                    "changes, but also said she had not felt very hungry; the reduced-appetite detail "
                    "was spoken and differs from the brief note."
                )
                claims = [
                    _claim(
                        1,
                        "Weight fell from 78 kg to 66 kg (15.4%).",
                        ["obs-maria-weight-2025", "obs-maria-weight-current"],
                    ),
                    _claim(
                        2,
                        "Maria mentioned both dietary changes and reduced appetite in February.",
                        ["seg-maria-feb-diet"],
                    ),
                ]
                sources = [index[source_id] for source_id in ids]
            else:
                answer = "Permitted sources do not contain enough structured weights to calculate a change."
                status = "insufficient_evidence"
                sources = current
        elif "back" in lowered or "abdominal pain" in lowered:
            if has("seg-maria-june-back"):
                answer = (
                    "Maria mentioned pain between her shoulder blades in the June 4 call and "
                    "attributed it to gardening. I did not find a permitted historical statement "
                    "confirming abdominal pain. This is a recalled statement, not a diagnosis."
                )
                claims = [
                    _claim(
                        1,
                        "She reported pain between the shoulder blades and attributed it to gardening.",
                        ["seg-maria-june-back"],
                    )
                ]
                sources = [index["seg-maria-june-back"]]
            else:
                answer = "I could not find back or abdominal pain in the permitted loaded sources."
                status = "insufficient_evidence"
                sources = current
        elif "what's changed" in lowered or "what has changed" in lowered:
            relevant = [
                source_id
                for source_id in (
                    "obs-maria-weight-feb-2026",
                    "obs-maria-weight-current",
                    "current-note",
                )
                if has(source_id)
            ]
            notes_lower = notes_text.lower()
            changes = ["Weight is now 66 kg versus 71 kg at the February follow-up."]
            if "yellow" in notes_lower or "jaundice" in notes_lower or "icter" in notes_lower:
                changes.append("The current clinician note records yellowing of the eyes/jaundice.")
            answer = "Since the last office follow-up: " + " ".join(changes)
            claims = [
                _claim(
                    1,
                    changes[0],
                    ["obs-maria-weight-feb-2026", "obs-maria-weight-current"],
                )
            ]
            if len(changes) > 1:
                claims.append(_claim(2, changes[1], ["current-note"]))
            sources = [index[source_id] for source_id in relevant]
        elif "referral" in lowered and ("ct" in lowered or "pancreas" in lowered):
            relevant_ids = [
                source_id
                for source_id in (
                    "current-note",
                    "obs-maria-weight-2025",
                    "obs-maria-weight-current",
                    "seg-maria-june-0412",
                    "seg-maria-june-back",
                )
                if has(source_id)
            ]
            answer = (
                "Draft — not sent\n\nUrgent imaging referral: Maria Conti, 58, has a documented "
                "weight change from 78 kg to 66 kg. The current consultation note records yellowing "
                "of the eyes. Historical spoken evidence includes persistent pale, greasy, floating "
                "stools with reduced appetite and pain between the shoulder blades. Please consider "
                "an urgent pancreas-protocol CT as requested by the clinician. This referral organizes "
                "the concerning history and does not assert a cancer diagnosis."
            )
            claims = [
                _claim(1, "Documented weight change: 78 kg to 66 kg.", relevant_ids[:3]),
                _claim(
                    2,
                    "Historical symptoms are included as patient-reported, spoken evidence.",
                    [item for item in relevant_ids if item.startswith("seg-")],
                ),
            ]
            sources = [index[source_id] for source_id in relevant_ids]
        elif "italian" in lowered or "in italiano" in lowered:
            relevant_ids = [
                source_id
                for source_id in ("current-note", "obs-maria-weight-current")
                if has(source_id)
            ]
            answer = (
                "Bozza per Maria — non inviata\n\nMaria, oggi abbiamo notato che il suo peso è "
                "66 kg e che gli occhi appaiono gialli. Per capire la causa, il medico ha spiegato "
                "che servono esami del sangue urgenti e una TAC con protocollo pancreatico. Questi "
                "sono esami di approfondimento: al momento non c’è una diagnosi confermata. La "
                "contatteremo quando saranno disponibili i risultati."
            )
            claims = [
                _claim(1, "Il piano riflette soltanto la nota e le istruzioni di oggi.", relevant_ids)
            ]
            sources = [index[source_id] for source_id in relevant_ids]
        elif "what did i tell" in lowered and "test" in lowered:
            today = [source for source in current if re.search(r"\b(test|blood|ct|scan|bilirubin|lipase)\b", source["text"], re.I)]
            if today:
                answer = (
                    "Today’s current note/transcript says you explained the need for urgent blood "
                    "tests and a pancreas-protocol CT, while making clear this is investigation rather "
                    "than a confirmed diagnosis."
                )
                claims = [_claim(1, "Tests discussed today.", [source["id"] for source in today[:3]])]
                sources = today
            else:
                answer = "I could not find a finalized current note or transcript statement about tests."
                status = "insufficient_evidence"
                sources = current
        elif "rating as a doctor" in lowered or "could i improve" in lowered:
            live = [source for source in current if source["kind"] == "current_transcript"]
            if live:
                answer = (
                    "Communication/process coaching (not a validated competency rating): you stated "
                    "the investigation plan. Consider checking Maria’s understanding, explicitly "
                    "inviting questions, and confirming who will call with results and when."
                )
                claims = [_claim(1, "Coaching is based on the finalized current transcript.", [s["id"] for s in live[:3]])]
                sources = live[:3]
            else:
                answer = (
                    "Communication/process coaching (not a validated competency rating): there is no "
                    "finalized current transcript to assess concrete moments. Once available, I can "
                    "comment on explanation, understanding checks, questions, and follow-up clarity."
                )
                status = "insufficient_evidence"
                sources = current
        elif lowered.startswith("add a follow-up") or "local follow-up" in lowered:
            answer = (
                "I prepared a local-only follow-up for bilirubin, liver panel, lipase, and CA 19-9 "
                "results by Thursday. It is not synchronized with an EHR or task system."
            )
            task = {
                "text": "Review bilirubin, liver panel, lipase, and CA 19-9 results",
                "due_date": "2026-10-01",
                "completed": False,
                "local_only": True,
            }
            sources = [source for source in current if "bilirubin" in source["text"].lower()]
            claims = [_claim(1, "The follow-up mirrors the clinician’s current plan.", [s["id"] for s in sources])]
        elif (
            "biomedical" in lowered
            or "association" in lowered
            or "relationship" in lowered
        ) and "diabetes" in lowered and "pancrea" in lowered:
            result = await self.bte.relationship("type 2 diabetes", "pancreatic cancer")
            knowledge_status = result["status"]
            if result["relationships"]:
                answer = (
                    "BioThings Explorer returned public biomedical relationships between the "
                    "requested concepts. These relationships are general knowledge and are not "
                    "evidence that this patient has pancreatic cancer."
                )
            elif knowledge_status == "unavailable":
                answer = (
                    "Patient-history context remains available, but the external biomedical lookup "
                    "was unavailable. That failure does not imply that no association exists."
                )
            else:
                answer = (
                    "The bounded BioThings query returned no normalized relationship for these public "
                    "concepts. This is not evidence for or against a patient diagnosis."
                )
            sources = []
            limitations.append("No patient data was sent to BioThings Explorer.")
        else:
            search = self.records.search_patient_history(patient_id, question)
            matches = search["sources"][:3]
            if matches:
                answer = "I found these relevant permitted historical excerpts: " + " ".join(
                    source["text"] for source in matches
                )
                claims = [
                    _claim(number, source["text"], [source["id"]])
                    for number, source in enumerate(matches, 1)
                ]
                sources = matches
            else:
                answer = "I could not find that fact in the permitted loaded sources."
                status = "insufficient_evidence"
                sources = current

        valid_ids = {source["id"] for source in sources}
        claims = [
            Claim(
                id=claim.id,
                text=claim.text,
                source_ids=[source_id for source_id in claim.source_ids if source_id in valid_ids],
            )
            for claim in claims
        ]
        claims = [claim for claim in claims if claim.source_ids]
        return ChatResponse(
            answer_id=f"answer-{uuid.uuid4().hex[:12]}",
            status=status,  # type: ignore[arg-type]
            answer=answer,
            claims=claims,
            sources=sources,
            graph=_graph(claims, sources),
            consent_version=history["consent_version"],
            knowledge_status=knowledge_status,  # type: ignore[arg-type]
            limitations=limitations,
            task=task,
        )
