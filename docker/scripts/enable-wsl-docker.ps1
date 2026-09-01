#Requires -Version 5.1
<#
.SYNOPSIS
  Open Docker Desktop WSL integration instructions and optionally retry migration.
#>
Write-Host ""
Write-Host "Docker WSL integration required for migrate-to-wsl.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor Cyan
Write-Host "  1. Open Docker Desktop"
Write-Host "  2. Settings (gear) -> Resources -> WSL Integration"
Write-Host "  3. Enable toggle for Ubuntu"
Write-Host "  4. Apply & Restart"
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host "  wsl -d Ubuntu bash /mnt/c/projict-new/WhatsApp-API-SaaS/docker/scripts/migrate-to-wsl.sh"
Write-Host ""
Write-Host "Meanwhile the Windows stack works (already fast with Docker volumes):" -ForegroundColor Green
Write-Host "  docker compose -f compose.yaml -f compose.dev.yaml --profile dev up -d"
Write-Host ""

$open = Read-Host "Open Docker Desktop now? [Y/n]"
if ($open -ne 'n' -and $open -ne 'N') {
    Start-Process "docker-desktop://settings/resources/wsl-integration" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
        Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    }
}
