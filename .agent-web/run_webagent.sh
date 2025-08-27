#!/usr/bin/env bash
set -euo pipefail

BASE="$(cd "$(dirname "$0")/.." && pwd)"
PIDFILE="$BASE/.agent-web/run_webagent.pid"
LOGDIR="$BASE/.agent-web/reports"
mkdir -p "$LOGDIR"

# --- Make Node & pnpm visible even in non-login shells ---
NODE_DIR="/home/donkey_right_productions/.nvm/versions/node/v20.19.4/bin"
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$NODE_DIR:$PNPM_HOME:$PATH"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Best-effort ensure pnpm is available
command -v pnpm >/dev/null 2>&1 || corepack enable >/dev/null 2>&1 || true

MODEL="${MODEL:-gemini-2.5-pro}"
ITERS="${ITERS:-25}"
TIMEOUT="${TIMEOUT:-9000}"
GOALS_TEXT="${GOALS_TEXT:-}"

# If already running, bail out cleanly
if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE" || true)"
  if [ -n "${PID:-}" ] && ps -p "$PID" >/dev/null 2>&1; then
    echo "[WEBAGENT] Already running PID $PID"
    exit 0
  else
    rm -f "$PIDFILE"
  fi
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
LOG="$LOGDIR/webagent-$STAMP.log"

(
  echo "[WEBAGENT] $(date -u +%FT%T%z) Start model=$MODEL iters=$ITERS timeout=$TIMEOUT"
  echo "[WEBAGENT] repo=$BASE"
  echo "[WEBAGENT] node=$(command -v node || echo missing)"
  echo "[WEBAGENT] pnpm=$(command -v pnpm || echo missing)"
  node -v 2>&1 | sed 's/^/[WEBAGENT] /' || true
  pnpm -v 2>&1 | sed 's/^/[WEBAGENT] /' || true

  exec python3 "$BASE/.agent-web/web_agent.py" \
    --repo "$BASE" \
    --model "$MODEL" \
    --iters "$ITERS" \
    --timeout "$TIMEOUT" \
    ${GOALS_TEXT:+--goals "$GOALS_TEXT"}
) >>"$LOG" 2>&1 &

echo $! > "$PIDFILE"
echo "$LOG"
