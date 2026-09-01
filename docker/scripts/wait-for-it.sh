#!/usr/bin/env sh
# wait-for-it.sh — wait until a TCP host:port is available, then optionally run a command.
# Usage: wait-for-it.sh host:port [-t timeout] [-- command args...]
set -eu

HOSTPORT="${1:-}"
shift || true

TIMEOUT=60
QUIET=0

usage() {
  echo "Usage: $0 host:port [-t timeout] [-- command args...]" >&2
  exit 1
}

[ -n "$HOSTPORT" ] || usage

HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT##*:}"

[ "$HOST" != "$PORT" ] || usage
[ -n "$HOST" ] && [ -n "$PORT" ] || usage

while [ "${1:-}" != "" ]; do
  case "$1" in
    -t|--timeout)
      TIMEOUT="${2:-}"
      shift 2
      ;;
    -q|--quiet)
      QUIET=1
      shift
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

log() {
  if [ "$QUIET" -eq 0 ]; then
    echo "$@"
  fi
}

start_ts=$(date +%s)
log "Waiting for ${HOST}:${PORT} (timeout ${TIMEOUT}s)..."

while :; do
  if command -v nc >/dev/null 2>&1; then
    if nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
      break
    fi
  elif (echo >/dev/tcp/"$HOST"/"$PORT") >/dev/null 2>&1; then
    break
  else
    # Fallback: try wget/curl against HTTP health if host is HTTP-capable
    if command -v wget >/dev/null 2>&1; then
      if wget -qO- "http://${HOST}:${PORT}/" >/dev/null 2>&1; then
        break
      fi
    fi
  fi

  now_ts=$(date +%s)
  elapsed=$((now_ts - start_ts))
  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "Timeout after ${TIMEOUT}s waiting for ${HOST}:${PORT}" >&2
    exit 1
  fi
  sleep 1
done

log "${HOST}:${PORT} is available."

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exit 0
