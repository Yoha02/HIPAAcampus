#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/backend/.venv/bin/python"

# Rosetta-launched npm prefers x86 slices from universal binaries. The local
# dependency wheels are native arm64 on Apple Silicon, so force the matching slice.
if [ "$(uname -s)" = "Darwin" ] && /usr/bin/arch -arm64 /usr/bin/true >/dev/null 2>&1; then
  exec /usr/bin/arch -arm64 "$PYTHON_BIN" "$@"
fi

exec "$PYTHON_BIN" "$@"
