#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT=3001
URL="http://127.0.0.1:${PORT}"

if lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} is already active. Opening ${URL}..."
  open "${URL}"
  exit 0
fi

echo "Starting NexoPost dev server on ${URL}..."
( sleep 4 && open "${URL}" ) >/dev/null 2>&1 &
npm run dev:3001
