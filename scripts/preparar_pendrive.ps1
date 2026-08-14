param(
    [string]$DestinoUSB = "X:\",
    [switch]$SoAcores
)

$raiz = "D:\Acores"
$estacoes = @("ACORES")
if (-not $SoAcores) { $estacoes = @("ACORES", "AVELEDA", "ALCANTARILHA") }

Write-Host "=== PREPARAR PENDRIVE ===" -ForegroundColor Cyan
Write-Host "Destino: $DestinoUSB"
Write-Host "Estacoes: $($estacoes -join ', ')"

if (-not (Test-Path $DestinoUSB)) {
    Write-Host "ERRO: USB nao encontrada em $DestinoUSB" -ForegroundColor Red
    exit 1
}

$espacoLivre = (Get-PSDrive -Name $DestinoUSB[0]).Free / 1GB
Write-Host "Espaco livre na USB: $([math]::Round($espacoLivre,1)) GB"

foreach ($estacao in $estacoes) {
    $srcDir = switch ($estacao) {
        "ACORES" { $raiz }
        "AVELEDA" { "D:\AVELEDA" }
        "ALCANTARILHA" { "D:\ALCANTARILHA" }
    }
    
    if (-not (Test-Path $srcDir)) {
        Write-Host "Aviso: $estacao nao encontrada" -ForegroundColor Yellow
        continue
    }
    
    $destDir = Join-Path $DestinoUSB "OREY_$estacao"
    Write-Host "A copiar $estacao -> $destDir ..."
    
    # Copiar tudo incluindo recursos grandes
    robocopy $srcDir $destDir /E /NJH /NJS /NP /NDL /XD node_modules .next > $null
    
    # Verificar se ha espaco para node_modules e .next
    $srcNodeModules = Join-Path $srcDir "node_modules"
    $srcNext = Join-Path $srcDir ".next"
    
    if ((Get-PSDrive -Name $DestinoUSB[0]).Free -gt 1GB) {
        if (Test-Path $srcNodeModules) {
            robocopy $srcNodeModules (Join-Path $destDir "node_modules") /E /NJH /NJS /NP > $null
        }
        if (Test-Path $srcNext) {
            robocopy $srcNext (Join-Path $destDir ".next") /E /NJH /NJS /NP > $null
        }
    } else {
        Write-Host "  Espaco insuficiente para copiar node_modules e .next" -ForegroundColor Yellow
        Write-Host "  A estacao precisara de CONFIGURAR.bAT para copiar localmente" -ForegroundColor Yellow
    }
    
    Write-Host "  OK" -ForegroundColor Green
}

Write-Host "=== Pendrive preparado ===" -ForegroundColor Green