#!/usr/bin/env bash
# Runs the local whisper.cpp HTTP server that /api/transcribe forwards audio to.
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

if [ ! -x "$WHISPER_BIN" ] || [ ! -f "$WHISPER_MODEL_PATH" ]; then
  echo "whisper-server or model missing. Run: npm run whisper:setup" >&2
  exit 1
fi

VAD_ARGS=()
if [ -f "$WHISPER_VAD_MODEL_PATH" ]; then
  VAD_ARGS=(--vad --vad-model "$WHISPER_VAD_MODEL_PATH")
else
  echo "VAD model missing; silence may be transcribed as filler. Run: npm run whisper:setup" >&2
fi

exec "$WHISPER_BIN" \
  --host "$WHISPER_HOST" \
  --port "$WHISPER_PORT" \
  --model "$WHISPER_MODEL_PATH" \
  --language "${WHISPER_LANGUAGE:-en}" \
  --suppress-nst \
  --no-language-probabilities \
  "${VAD_ARGS[@]}"
