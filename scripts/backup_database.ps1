# Backup da base de dados SQLite e dos exports gerados.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/backup_database.ps1 [-Reter 7]
param(
  [int]$Reter = 7
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$db = Join-Path $root "prisma\local.db"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = Join-Path $root "backups\$stamp"

if (-not (Test-Path -LiteralPath $db)) {
  Write-Host "ERRO: base de dados nao encontrada em $db" -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Path $dest -Force | Out-Null

Copy-Item -LiteralPath $db -Destination (Join-Path $dest "local.db") -Force

$exports = Join-Path $root "exports"
if (Test-Path -LiteralPath $exports) {
  Get-ChildItem -LiteralPath $exports -Filter "*.xlsx" | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dest $_.Name) -Force
  }
}

$info = @{
  criadoEm = (Get-Date).ToString("o")
  navios = 0
} | ConvertTo-Json
Set-Content -Path (Join-Path $dest "info.json") -Value $info -Encoding UTF8

Write-Host "Backup criado em $dest"

# Limpeza de backups antigos
$backupsRoot = Join-Path $root "backups"
Get-ChildItem -LiteralPath $backupsRoot -Directory | Sort-Object Name -Descending | Select-Object -Skip $Reter | ForEach-Object {
  Remove-Item -LiteralPath $_.FullName -Recurse -Force
  Write-Host "Removido backup antigo: $($_.Name)"
}
