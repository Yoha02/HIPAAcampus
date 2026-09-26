# HIPAAcampus

Meeting-notes workspace built with TanStack Start, React 19, Vite 8, Tailwind CSS 4, and shadcn/ui. Live transcription runs entirely on this machine through [whisper.cpp](https://github.com/ggml-org/whisper.cpp), so audio never leaves the device.

## Run locally

Requires Node.js 22.12+ (pinned in `.nvmrc`), Xcode Command Line Tools (for `clang`), and Python 3.

```sh
git submodule update --init   # fetch vendor/whisper.cpp (first clone only)
nvm use                       # or: nvm install
npm install
npm run whisper:setup         # build whisper-server + download the model (one-time)
npm run dev:all               # whisper server + app at http://localhost:8080
```

`npm run dev` starts only the app; recording then shows a "transcription server isn't running" message until `npm run whisper:server` is started.

Other scripts:

| Command                  | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `npm run whisper:server` | Run only the whisper.cpp server (port 8178) |
| `npm run build`          | Production build into `.output/`            |
| `npm run preview`        | Serve the production build                  |
| `npm run lint`           | ESLint + Prettier checks                    |
| `npm run format`         | Format with Prettier                        |

## Transcription

The browser captures microphone audio, downsamples it to 16 kHz mono WAV, and sends a chunk every 5 seconds to `POST /api/transcribe`. That route forwards the audio to the local `whisper-server` built from `vendor/whisper.cpp` (a git submodule pinned to v1.9.4) and requests `verbose_json`, so every segment comes back with start/end times. Silent chunks are skipped in the browser, whisper.cpp's Silero voice-activity detection drops non-speech audio (which otherwise gets hallucinated as filler like "Thank you."), segments whisper flags as likely non-speech are discarded, and tags such as `[BLANK_AUDIO]` are stripped.

The transcript panel starts empty and fills in only with what Whisper transcribes. It shows a metadata header (date, actual recording start time, duration, passage count), then time-stamped passages. A new passage starts after a pause longer than 3 seconds or once a passage reaches 45 seconds. The transcript is not split by speaker. The download button exports WebVTT with millisecond cues.

Build output and models live in `.whisper/` (git-ignored). `whisper:setup` installs a local CMake into `.whisper/venv` if none is on your `PATH`.

| Variable             | Default                 | Used by                                       |
| -------------------- | ----------------------- | --------------------------------------------- |
| `WHISPER_MODEL`      | `base.en`               | setup + server (e.g. `small.en`, `medium.en`) |
| `WHISPER_VAD_MODEL`  | `silero-v6.2.0`         | setup + server                                |
| `WHISPER_LANGUAGE`   | `en`                    | server                                        |
| `WHISPER_PORT`       | `8178`                  | server                                        |
| `WHISPER_SERVER_URL` | `http://127.0.0.1:8178` | app's `/api/transcribe` route                 |

To switch to a more accurate model: `WHISPER_MODEL=small.en npm run whisper:setup`, then run the server with the same `WHISPER_MODEL`.

## Project structure

```
src/
  routes/                 File-based routes (TanStack Router)
    api/transcribe.ts     Server route that proxies audio to whisper-server
  lib/whisper.server.ts   Server-only whisper.cpp client
  components/
    ui/                   shadcn/ui primitives
    layout/               App header, brand mark
    shared/               Reusable pieces (tabs, search field, bottom sheet)
    app/                  Root-level 404 and error screens
  features/meeting/
    components/           Workspace, notes, summary, sources, transcript, chat, dock
    hooks/                Recorder, whisper transcription, timer, session chat
    lib/                  Mic capture, WAV encoding, transcription API, formatting
    data.ts               Demo meeting content
    types.ts              Shared types
scripts/whisper/          Build + run scripts for whisper.cpp
vendor/whisper.cpp/       whisper.cpp source (git submodule)
```
