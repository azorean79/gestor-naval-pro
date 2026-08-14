param(
    [string]$DestinoUSB = "X:\",
    [switch]$SoAcores
)

$raiz = "D:\Acores"
Write-Host "=== PREPARAR USB PORTATIL ===" -ForegroundColor Cyan
Write-Host "Origem: $raiz"
Write-Host "Destino: $DestinoUSB"

if (-not (Test-Path $DestinoUSB)) {
    Write-Host "ERRO: USB nao encontrada em $DestinoUSB" -ForegroundColor Red
    exit 1
}

$destDir = Join-Path $DestinoUSB "OREY_ACORES"

Write-Host "A copiar para $destDir ..."
Write-Host "(isto pode demorar alguns minutos...)" -ForegroundColor Yellow

# Copiar tudo exceto pastas grandes desnecessarias
robocopy $raiz $destDir /E /NJH /NJS /NP /NDL /XD .git .vercel backups terminal_logs temp > $null

Write-Host ""
Write-Host "=== PRONTO ===" -ForegroundColor Green
Write-Host ""
Write-Host "A aplicacao esta em: $destDir"
Write-Host "Node.js ja incluido na pasta bin/"
Write-Host ""
Write-Host "Para usar em qualquer PC:"
Write-Host "  1. Abrir $destDir"
Write-Host "  2. Executar INICIAR.bat"
Write-Host "  3. Abrir http://localhost:3000"
