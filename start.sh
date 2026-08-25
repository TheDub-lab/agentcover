#!/usr/bin/env bash
# AgentCover one-command boot: starts the backend (real safety_protocol engine)
# and the Expo dev server. Requires the safety_protocol engine on disk at
# C:/Users/michael/safety-protocol (adjust ENGINE_SRC if yours lives elsewhere).
set -e

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_SRC="${ENGINE_SRC:-C:/Users/michael/safety-protocol/src}"
BACKEND_PY="${BACKEND_PY:-C:/Users/michael/safety-protocol/.venv/Scripts/python.exe}"

echo "AgentCover boot"
echo "  engine src : $ENGINE_SRC"
echo "  backend py : $BACKEND_PY"

# 1) backend on :8731 (background)
PYTHONPATH="$ENGINE_SRC" "$BACKEND_PY" "$HERE/backend/server.py" &
BACKEND_PID=$!
echo "  backend pid: $BACKEND_PID  (http://127.0.0.1:8731)"

# 2) expo dev server (foreground; Ctrl-C stops both)
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT INT TERM
cd "$HERE"
npx expo start "$@"
