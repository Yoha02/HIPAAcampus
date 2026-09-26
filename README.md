# HIPAcampus

Local clinician-context hackathon prototype built with TanStack Start/React, FastAPI, SQLite,
the official Python MCP SDK, and local whisper.cpp transcription.

> **Synthetic demo only.** Every patient, encounter, transcript, and source in this repository is
> fictional. Do not enter real patient information.

## What works

- Clinician-owned rich-text notes, included from the editor in every submitted question.
- Real local microphone capture and five-second finalized transcription chunks through whisper.cpp.
- A resettable Maria Conti demonstration with exact historical note/transcript citations.
- A local SQLite record service and separately runnable read-only MCP stdio server.
- Per-patient category consent enforced at each record/chat call.
- Doctor/patient isolation and a fixed, structured cohort query over Dr. Nguyen’s active panel.
- Grounded deterministic answers, post-visit drafts, local-only follow-up tasks, source cards, and a
  deterministic claim-to-evidence graph.
- A bounded BioThings Explorer TRAPI adapter that sends public concept IDs only.
- An optional AWS Bedrock `converse` adapter using a workshop-provided `BEDROCK_MODEL_ID`.

The canonical local flow does not require cloud credentials. Its model status is
`local_deterministic`; it never presents that mode as a live model connection.

## First-time setup

Requirements: Node.js 22.12 or newer, Python 3.10 or newer, and Xcode Command Line Tools if local
Whisper will be built.

```sh
npm install
npm run backend:setup
npm run backend:seed
```

For microphone transcription, initialize and build the existing pinned whisper.cpp service:

```sh
git submodule update --init
npm run whisper:setup
```

Whisper models/build products and the generated SQLite database are local ignored artifacts. The
version-controlled fixture remains the source of truth.

## Run

Run the complete app, including local transcription:

```sh
npm run dev:all
```

Then open [http://localhost:8080](http://localhost:8080).

For the app without Whisper (notes, records, chat, consent, and graph still work):

```sh
npm run dev:demo
```

Individual processes:

```sh
npm run backend:dev     # FastAPI on http://127.0.0.1:8000
npm run whisper:server  # whisper.cpp on http://127.0.0.1:8178
npm run dev             # TanStack app on http://localhost:8080
```

## Reset, seed, and test

Use **Reset demo** in the UI to clear the current session, local tasks, and chat, restore Maria’s
prepared current note, and restore consent through that explicit control.

To recreate all historical data:

```sh
npm run backend:validate
npm run backend:seed
```

To verify the implementation:

```sh
npm run backend:test
npm run lint
npm run build
```

## Canonical demo

Maria is selected on startup. The reset note records her current 66 kg weight, yellow eyes, and the
clinician’s investigation plan.

1. Ask `What's changed since her last visit?`
2. Ask `Why did Maria stop metformin?`, click a citation, and show the June 4 spoken-only excerpt.
3. Ask `Has her weight changed, and did she say why?`
4. Ask `Did she ever mention back or abdominal pain?`
5. Ask an absent fact and show the explicit evidence gap.
6. Ask for the urgent CT referral draft, plain-Italian summary, today’s test discussion, coaching,
   and the local follow-up.
7. Ask `Which of my patients over 50 were diagnosed with diabetes in the last two years and have
   lost more than 5% of their body weight?`
8. In **Consent**, revoke `Medications`, repeat the metformin question, and show that the details and
   source cards are no longer returned. Use **Reset demo** to restore consent.

No flow orders a test, sends a referral/message, writes to an EHR, or asserts pancreatic cancer.

## Data and backend layout

- `backend/fixtures/synthetic_records.json`: deterministic 17-patient fixture, including Maria and
  second-doctor negative fixtures.
- `backend/app/schema.sql`: SQLite schema, constraints, and indexes.
- `backend/app/seed.py`: reproducible seed and validation command.
- `backend/app/records.py`: doctor-scoped, consent-filtered record tools.
- `backend/app/mcp_server.py`: official Python MCP stdio server.
- `backend/app/main.py`: FastAPI sessions, chat, consent, task, reset, and health routes.
- `backend/tests`: direct record and end-to-end API tests.

The FastAPI service uses the same record-tool implementation in process, so it remains the trusted
MCP client boundary without exposing a browser-to-MCP or browser-to-SQL route. The stdio MCP server
is available for direct tool testing:

```sh
PYTHONPATH=backend backend/.venv/bin/python -m app.mcp_server
```

## Provider modes

Copy `.env.example` values into your shell or local environment as needed.

- **Model:** `HIPACAMPUS_MODEL_MODE=local` is the deterministic demo default. For Bedrock, set
  `HIPACAMPUS_MODEL_MODE=bedrock`, the workshop’s exact `BEDROCK_MODEL_ID`, AWS region, and normal
  AWS credentials. No model ID is invented in code.
- **BioThings Explorer:** the adapter targets the current documented production TRAPI route,
  `https://api.bte.ncats.io/v1/query`. Results are labelled `live`, `cached`, `unavailable`,
  `no_match`, `mocked`, or `not_requested`. Patient data is never included.
- **Transcription:** browser microphone audio is downsampled to 16 kHz mono WAV and sent to the local
  whisper.cpp server. This captures the selected microphone, not automatically the remote side of a
  telehealth call, and it does not perform speaker diarization.
