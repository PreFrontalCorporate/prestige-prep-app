#!/usr/bin/env bash
set -euo pipefail

REPO=""
MODEL="${MODEL:-gemini-2.5-pro}"
ITERS="${ITERS:-25}"
TIMEOUT="${TIMEOUT:-9000}"
GOALS_FILE="${GOALS_FILE:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --iters) ITERS="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --goals-file) GOALS_FILE="$2"; shift 2 ;;
    *) echo "[WEBAGENT] Unknown arg: $1" >&2; shift ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "[WEBAGENT] --repo is required" >&2
  exit 2
fi

BASE="$REPO"
AGENT_DIR="$BASE/.agent-web"
REPORTS="$AGENT_DIR/reports"
PID_FILE="$AGENT_DIR/run.pid"

mkdir -p "$REPORTS"

# prefer explicit goals file else default
[[ -z "${GOALS_FILE}" && -f "$AGENT_DIR/goals.txt" ]] && GOALS_FILE="$AGENT_DIR/goals.txt"
GOALS_CONTENT=""
if [[ -n "${GOALS_FILE}" && -f "${GOALS_FILE}" ]]; then
  GOALS_CONTENT="$(cat "${GOALS_FILE}")"
fi

# NVM / Node / pnpm
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
fi
NODE_BIN="$(command -v node || true)"
PNPM_BIN="$(command -v pnpm || true)"

echo "[WEBAGENT] $(date -u +%Y-%m-%dT%H:%M:%S%z) Start model=${MODEL} iters=${ITERS} timeout=${TIMEOUT}"
echo "[WEBAGENT] repo=${REPO}"
echo "[WEBAGENT] node=$NODE_BIN"
echo "[WEBAGENT] pnpm=$PNPM_BIN"
[[ -n "$NODE_BIN" ]] && "$NODE_BIN" -v || true
[[ -n "$PNPM_BIN" ]] && "$PNPM_BIN" -v || true

# Baseline build to ensure project compiles
set +e
( cd "$BASE" && pnpm build )
RC=$?
set -e
echo "[WEBAGENT] Baseline build rc: $RC"

PY_BIN="$(command -v python3 || command -v python || true)"
if [[ -z "$PY_BIN" ]]; then
  echo "[WEBAGENT] python not found" >&2
  exit 3
fi

exec "$PY_BIN" "$AGENT_DIR/web_agent.py" \
  --repo "$REPO" \
  --model "$MODEL" \
  --iters "$ITERS" \
  --timeout "$TIMEOUT" \
  --goals "$GOALS_CONTENT"
