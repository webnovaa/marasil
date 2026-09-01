#!/bin/sh
set -eu

if [ -z "${SESSION_MASTER_KEY:-}" ]; then
  export SESSION_MASTER_KEY="${INTERNAL_HMAC_SECRET:?INTERNAL_HMAC_SECRET is required}"
fi

if [ -z "${SOCKET_TOKEN_SECRET:-}" ]; then
  export SOCKET_TOKEN_SECRET="${INTERNAL_HMAC_SECRET}"
fi

SESSION_DIR="${SESSION_STORE_PATH:-/data/sessions}"
mkdir -p "${SESSION_DIR}"
chmod 700 "${SESSION_DIR}"

# Volume mounts may be root-owned; persist sessions as user "wa".
if [ "$(id -u)" = "0" ]; then
  chown -R wa:wa "${SESSION_DIR}"
  exec su-exec wa "$@"
fi

exec "$@"
