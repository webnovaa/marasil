#!/bin/bash
# Migrate project to WSL2 filesystem and run Docker from there (fastest on Windows).
set -euo pipefail

TARGET="${HOME}/WhatsApp-API-SaaS"
SRC="/mnt/c/projict-new/WhatsApp-API-SaaS"
WSL_DISTRO="${WSL_DISTRO:-Ubuntu}"

if [ -x "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe" ]; then
  DOCKER="/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe"
elif command -v docker >/dev/null 2>&1; then
  DOCKER="docker"
else
  echo "ERROR: Docker not found."
  echo "Enable WSL integration first (see below)."
  exit 1
fi

# Docker Desktop must expose ubuntu.sock for bind mounts from this distro.
if [ ! -S "/run/guest-services/distro-services/${WSL_DISTRO,,}.sock" ] \
   && [ ! -S "/mnt/wsl/docker-desktop/shared-sockets/guest-services/distro-services/${WSL_DISTRO,,}.sock" ]; then
  echo ""
  echo "ERROR: Docker WSL integration is not enabled for ${WSL_DISTRO}."
  echo ""
  echo "Fix (one-time):"
  echo "  1. Open Docker Desktop"
  echo "  2. Settings → Resources → WSL Integration"
  echo "  3. Turn ON \"${WSL_DISTRO}\""
  echo "  4. Apply & Restart Docker Desktop"
  echo "  5. Re-run this script"
  echo ""
  echo "Until then, keep using the Windows copy (already optimized):"
  echo "  cd C:\\projict-new\\WhatsApp-API-SaaS"
  echo "  docker compose -f compose.yaml -f compose.dev.yaml --profile dev up -d"
  echo ""
  exit 1
fi

echo "==> Syncing to ${TARGET}..."
mkdir -p "${TARGET}"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude node_modules --exclude vendor --exclude .git \
    "${SRC}/" "${TARGET}/"
else
  cp -a "${SRC}/." "${TARGET}/"
fi

cd "${TARGET}"
test -f .env || cp .env.example .env
cp .env apps/platform/.env

echo "==> Restarting stack from WSL path..."
"$DOCKER" compose -f compose.yaml -f compose.dev.yaml --profile dev down 2>/dev/null || true
"$DOCKER" compose -f compose.yaml -f compose.dev.yaml --profile dev up -d --build

echo "==> Waiting for API..."
sleep 25
"$DOCKER" compose -f compose.yaml -f compose.dev.yaml --profile dev exec -T api php artisan --version || true

curl -s -o /dev/null -w "up: %{time_total}s\n" http://localhost:8080/up || true

echo ""
echo "Done. Open project in Cursor from:"
echo "  \\\\wsl$\\${WSL_DISTRO}\\home\\$(whoami)\\WhatsApp-API-SaaS"
