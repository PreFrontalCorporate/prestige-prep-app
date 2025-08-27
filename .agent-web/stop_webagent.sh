#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.." && pwd)"
PIDFILE="$BASE/.agent-web/run_webagent.pid"
if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE" || true)"
  if [ -n "${PID:-}" ] && ps -p "$PID" >/dev/null 2>&1; then
    kill -TERM "$PID" || true
    sleep 1
    if ps -p "$PID" >/dev/null 2>&1; then kill -KILL "$PID" || true; fi
  fi
  rm -f "$PIDFILE"
fi
echo "[WEBAGENT] Stopped (if it was running)"
