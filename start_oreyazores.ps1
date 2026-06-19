# OREYAZORES 1.0 - Script de Inicialização
# Este script inicia o servidor Next.js e abre a aplicação no navegador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OREYAZORES 1.0 - Iniciando...        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define o diretório da aplicação
$appPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $appPath
$portableNodePath = Join-Path $appPath "runtime\node.exe"
$nextCliPath = Join-Path $appPath "node_modules\next\dist\bin\next"

function Start-NextDevServer {
    param(
        [string]$Path,
        [string]$PortableNode,
        [string]$NextCli
    )

    Set-Location $Path

    if ((Test-Path $PortableNode) -and (Test-Path $NextCli)) {
        & $PortableNode $NextCli dev
        return
    }

    npm run dev
}

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências (primeira execução)..." -ForegroundColor Yellow
    npm install
}

Write-Host "Iniciando servidor Next.js..." -ForegroundColor Green
Write-Host "Aguarde alguns segundos para a aplicação compilar..." -ForegroundColor Yellow
Write-Host ""
Write-Host "A aplicação abrirá automaticamente em: http://localhost:3000" -ForegroundColor Green
Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Inicia o servidor em background e captura o processo
$job = Start-Job -ScriptBlock {
    param($path, $portableNode, $nextCli)

    function Start-NextDevServer {
        param(
            [string]$Path,
            [string]$PortableNode,
            [string]$NextCli
        )

        Set-Location $Path

        if ((Test-Path $PortableNode) -and (Test-Path $NextCli)) {
            & $PortableNode $NextCli dev
            return
        }

        npm run dev
    }

    Start-NextDevServer -Path $path -PortableNode $portableNode -NextCli $nextCli
} -ArgumentList $appPath, $portableNodePath, $nextCliPath

# Aguarda 8 segundos para o servidor iniciar
Start-Sleep -Seconds 8

# Abre o navegador
Start-Process "http://localhost:3000"

Write-Host "✓ Aplicação iniciada com sucesso!" -ForegroundColor Green
Write-Host "✓ Navegador aberto em http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor..." -ForegroundColor Yellow

# Aguarda o job e mostra o output
Receive-Job -Job $job -Wait
