#Requires -Version 5.1
<#
.SYNOPSIS
  Copy project to WSL2 (Ubuntu) for fast Docker bind mounts.

.DESCRIPTION
  Docker on Windows is slow when the project lives on C:\ because every PHP/Vite
  file read crosses the Windows<->Linux boundary. Running from ~/ inside WSL2 is
  typically 10-50x faster.

  Prerequisites: Ubuntu on WSL2 (wsl --install Ubuntu)
#>
param(
    [string]$WslDistro = 'Ubuntu',
    [string]$TargetDir = '~/WhatsApp-API-SaaS'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "==> Checking WSL distro '$WslDistro'..." -ForegroundColor Cyan
$check = wsl -d $WslDistro echo ok 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ubuntu WSL not found. Install with:" -ForegroundColor Yellow
    Write-Host "  wsl --install Ubuntu" -ForegroundColor White
    Write-Host "Then reboot, create a Linux user, and re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Syncing project to WSL ($TargetDir)..." -ForegroundColor Cyan
$winPath = ($ProjectRoot -replace '\\', '/') -replace '^([A-Z]):', { "/mnt/$($_.Groups[1].Value.ToLower())" }
wsl -d $WslDistro bash -lc @"
set -euo pipefail
mkdir -p $TargetDir
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude node_modules --exclude vendor --exclude .git \
    '$winPath/' '$TargetDir/'
else
  rm -rf '$TargetDir'/*
  cp -a '$winPath'/.' '$TargetDir/' 2>/dev/null || cp -r '$winPath'/* '$TargetDir/' || true
fi
cd '$TargetDir'
cp -n .env.example .env 2>/dev/null || true
cp -n .env apps/platform/.env 2>/dev/null || true
echo '==> Starting Docker stack from WSL...'
docker compose -f compose.yaml -f compose.dev.yaml --profile dev up -d --build
echo '==> Waiting for API...'
sleep 15
docker compose -f compose.yaml -f compose.dev.yaml --profile dev exec -T api php artisan --version
echo ''
echo 'Done. Open in Cursor/VS Code:'
echo '  \\\\wsl$\\$WslDistro\\home\\<user>\\WhatsApp-API-SaaS'
echo 'Or: wsl -d $WslDistro -e bash -lc \"cd $TargetDir && code .\"'
"@

Write-Host "==> Complete." -ForegroundColor Green
