#!/usr/bin/env bash
set -euo pipefail

echo "Starting ClimateDualNet FastAPI backend on 127.0.0.1:8000..."
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to become healthy (up to 60s if downloading from HF Hub)
for i in $(seq 1 60); do
  if python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" >/dev/null 2>&1; then
    echo "Backend is healthy."
    break
  fi
  sleep 1
done

echo "Starting Next.js frontend on 0.0.0.0:${PORT:-7860}..."
exec npx next start -H 0.0.0.0 -p "${PORT:-7860}"
