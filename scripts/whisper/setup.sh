#!/usr/bin/env bash
# Builds whisper-server from vendor/whisper.cpp and downloads a ggml model.
# Usage: npm run whisper:setup            (default model: base.en)
#        WHISPER_MODEL=small.en npm run whisper:setup
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

# Some workshop Macs expose a preview SDK whose text stubs are newer than the
# installed linker understands. Prefer the stable installed SDK for this local build.
if [ "$(uname -s)" = "Darwin" ] && [ -z "${SDKROOT:-}" ]; then
  ACTIVE_SDK="$(xcrun --show-sdk-path 2>/dev/null || true)"
  STABLE_SDK="/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk"
  if [[ "$ACTIVE_SDK" == *"/MacOSX27"* ]] && [ -d "$STABLE_SDK" ]; then
    export SDKROOT="$STABLE_SDK"
    export MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-15.0}"
    echo "==> Using compatible SDK: $SDKROOT"
  fi
fi

if [ ! -f "$WHISPER_SRC/CMakeLists.txt" ]; then
  echo "==> Fetching whisper.cpp submodule"
  git -C "$ROOT" submodule update --init vendor/whisper.cpp
fi

if command -v cmake >/dev/null 2>&1; then
  CMAKE="cmake"
else
  CMAKE="$WHISPER_HOME/venv/bin/cmake"
  if [ ! -x "$CMAKE" ]; then
    echo "==> cmake not found; installing a local copy into .whisper/venv"
    python3 -m venv "$WHISPER_HOME/venv"
    "$WHISPER_HOME/venv/bin/pip" install --quiet --upgrade pip cmake
  fi
fi

echo "==> Building whisper-server"
"$CMAKE" -S "$WHISPER_SRC" -B "$WHISPER_BUILD" \
  -DCMAKE_BUILD_TYPE=Release \
  -DWHISPER_BUILD_TESTS=OFF \
  -DWHISPER_BUILD_EXAMPLES=ON
"$CMAKE" --build "$WHISPER_BUILD" --config Release --target whisper-server -j

mkdir -p "$WHISPER_MODELS"
if [ -f "$WHISPER_MODEL_PATH" ]; then
  echo "==> Model $WHISPER_MODEL already downloaded"
else
  echo "==> Downloading model $WHISPER_MODEL"
  sh "$WHISPER_SRC/models/download-ggml-model.sh" "$WHISPER_MODEL" "$WHISPER_MODELS"
fi

if [ -f "$WHISPER_VAD_MODEL_PATH" ]; then
  echo "==> VAD model $WHISPER_VAD_MODEL already downloaded"
else
  echo "==> Downloading VAD model $WHISPER_VAD_MODEL"
  sh "$WHISPER_SRC/models/download-vad-model.sh" "$WHISPER_VAD_MODEL" "$WHISPER_MODELS"
fi

echo "==> Done. Start the transcription server with: npm run whisper:server"
