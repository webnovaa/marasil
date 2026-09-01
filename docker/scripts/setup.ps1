# Phase 1 setup helper for Windows (PowerShell). Prefer `make setup` on Git Bash/WSL.
# Quick start (after .env exists): docker compose -f compose.yaml -f compose.dev.yaml --profile dev up --build -d

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
Write-Host "Working directory: $(Get-Location)"

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example"
}

$envFile = Get-Content .env -Raw

function Ensure-Secret([string]$name) {
    if ($envFile -notmatch "(?m)^$name=.+$" -or $envFile -match "(?m)^$name=\s*$") {
        $bytes = New-Object byte[] 32
        [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        $value = [Convert]::ToBase64String($bytes)
        if ($envFile -match "(?m)^$name=") {
            $envFile = [regex]::Replace($envFile, "(?m)^$name=.*$", "$name=$value")
        } else {
            $envFile += "`n$name=$value`n"
        }
        Write-Host "Generated $name"
    }
}

Ensure-Secret "INTERNAL_HMAC_SECRET"

if ($envFile -match "(?m)^SESSION_MASTER_KEY=\s*$" -or $envFile -notmatch "(?m)^SESSION_MASTER_KEY=") {
    $hmac = [regex]::Match($envFile, "(?m)^INTERNAL_HMAC_SECRET=(.+)$").Groups[1].Value.Trim()
    if ($hmac) {
        if ($envFile -match "(?m)^SESSION_MASTER_KEY=") {
            $envFile = [regex]::Replace($envFile, "(?m)^SESSION_MASTER_KEY=.*$", "SESSION_MASTER_KEY=$hmac")
        } else {
            $envFile += "`nSESSION_MASTER_KEY=$hmac`n"
        }
        Write-Host "Set SESSION_MASTER_KEY from INTERNAL_HMAC_SECRET"
    }
}

$envFile = [regex]::Replace($envFile, "(?m)^MAILPIT_UI_PORT=.*\r?\n?", "")
$envFile = [regex]::Replace($envFile, "(?m)^MAILPIT_SMTP_PORT=.*\r?\n?", "")
if ($envFile -match "(?m)^MAIL_HOST=mailpit") {
    $envFile = [regex]::Replace($envFile, "(?m)^MAIL_MAILER=.*$", "MAIL_MAILER=log")
    $envFile = [regex]::Replace($envFile, "(?m)^MAIL_HOST=.*$", "MAIL_HOST=127.0.0.1")
    $envFile = [regex]::Replace($envFile, "(?m)^MAIL_PORT=.*$", "MAIL_PORT=2525")
    Write-Host "Reset mail driver to log (Mailpit removed from stack)"
}

Set-Content -Path .env -Value $envFile.TrimEnd() -NoNewline

Write-Host "Syncing apps/platform/.env from root .env..."
Copy-Item .env apps/platform/.env -Force

$compose = "docker compose -f compose.yaml -f compose.dev.yaml --profile dev"

Write-Host "Building frontend assets..."
Push-Location apps/platform
npm run build
if (Test-Path public/hot) { Remove-Item public/hot -Force }
Pop-Location

Invoke-Expression "$compose build"
Invoke-Expression "$compose up -d"

Write-Host "Waiting for postgres health..."
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
    Invoke-Expression "$compose exec -T postgres pg_isready -U whatsapp -d whatsapp_saas" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ready) { throw "Postgres did not become ready in time" }

Invoke-Expression "$compose exec -T api composer install --no-interaction"
Invoke-Expression "$compose exec -T api php artisan key:generate --force"
Invoke-Expression "$compose exec -T api php artisan migrate --force"
Invoke-Expression "$compose exec -T api php artisan package:discover --ansi"

Write-Host ""
Write-Host "=============================================="
Write-Host "  Marasil / مراسيل — development stack is ready"
Write-Host "=============================================="
Write-Host "  App:        http://localhost:8080"
Write-Host "  API health: http://localhost:8080/api/v1/health"
Write-Host "  Vite HMR:   http://localhost:5173"
Write-Host "=============================================="
