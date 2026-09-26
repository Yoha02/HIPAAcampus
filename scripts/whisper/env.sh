# Shared paths and defaults for the whisper.cpp scripts. Sourced, not executed.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WHISPER_SRC="$ROOT/vendor/whisper.cpp"
WHISPER_HOME="$ROOT/.whisper"
WHISPER_BUILD="$WHISPER_HOME/build"
WHISPER_MODELS="$WHISPER_HOME/models"
WHISPER_BIN="$WHISPER_BUILD/bin/whisper-server"

WHISPER_MODEL="${WHISPER_MODEL:-base.en}"
WHISPER_MODEL_PATH="$WHISPER_MODELS/ggml-$WHISPER_MODEL.bin"
WHISPER_VAD_MODEL="${WHISPER_VAD_MODEL:-silero-v6.2.0}"
WHISPER_VAD_MODEL_PATH="$WHISPER_MODELS/ggml-$WHISPER_VAD_MODEL.bin"
WHISPER_HOST="${WHISPER_HOST:-127.0.0.1}"
WHISPER_PORT="${WHISPER_PORT:-8178}"
