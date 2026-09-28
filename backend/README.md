# Local context service

This implements the first UI integration slice, retaining the existing frontend contracts.
It is deliberately an extractive baseline, so the provenance interaction works without AWS
credentials and can be compared with a future model adapter.

## Contract

- `GET /bootstrap`: synthetic patient identity, fixed date, documents and saved turns.
- `POST /chat`: `{ question, notes, transcript: [{ start, end, text }] }`.
  The existing Whisper hook provides completed segments only. No audio is sent here.
  Returns `{ id, role, question, sentences, sources, graph, mode }`.
- `POST /sources`: existing `SourceDocument` shape. Gives plain-text paragraphs stable
  passage IDs, persists the document, then returns the citable shape.
- `POST /summary`: same context as chat; returns `{ bullets }` from current context only.

An answer citation is `{ sourceId, passageId }`. Graph source nodes contain the same
citations; edges have `source`, `target` and `label`. The graph represents citation provenance,
not medical causality, similarity, or a confirmed diagnosis. Every supplied edge and citation
must resolve before a later model-generated response is rendered.

## Context and persistence

Historical source records are seeded from `fixtures.py`. SQLite stores imported documents,
immutable note/live snapshots and chat turns. Hash-based snapshot IDs preserve what was
actually used for an earlier answer. Earlier draft snapshots are excluded from subsequent
retrieval; only the text sent with the current question is current consultation context.

The source corpus never contains expected test answers or a future consultation script.
No future test order or referral is assumed to have been discussed. Repeated bootstrap calls
do not duplicate seeded documents. Tests use isolated temporary databases.

## Next backend slice

1. Add a Bedrock generation adapter behind this response contract, validating its citations
   against retrieved passages; keep extractive mode explicit when credentials are absent.
2. Add BioThings external evidence with actual provider provenance. Patient history queries
   must continue to work without external biomedical search.
3. Implement clinician-requested referral/Italian drafts and local follow-ups, grounded in
   the captured plan, followed by the documented seven-patient cohort query.
4. Verify the existing Whisper setup on the demo machine. Its current build scripts assume
   macOS tooling; this integration does not replace the recorder or claim Windows audio testing.
