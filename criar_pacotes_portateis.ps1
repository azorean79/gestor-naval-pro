param(
    [string]$DestinoBase = $env:TEMP,
    [switch]$SoAcores
)

Write-Host "=== CRIAR PACOTES PORTATEIS ===" -ForegroundColor Cyan

$estacoes = @(
    @{ Nome = "ACORES"; Dir = "D:\Acores"; Porto = 3000; Regiao = "ACORES" },
    @{ Nome = "AVELEDA"; Dir = "D:\AVELEDA"; Porto = 3002; Regiao = "NORTE" },
    @{ Nome = "ALCANTARILHA"; Dir = "D:\ALCANTARILHA"; Porto = 3001; Regiao = "ALGARVE" }
)

if ($SoAcores) { $estacoes = @($estacoes[0]) }

foreach ($estacao in $estacoes) {
    $nome = $estacao.Nome
    $dir = $estacao.Dir
    $porto = $estacao.Porto
    
    Write-Host "A processar $nome (porta $porto) ..."
    
    if (-not (Test-Path $dir)) {
        Write-Host "  AVISO: $dir nao encontrado" -ForegroundColor Yellow
        continue
    }
    
    # Criar pasta portatil
    $pastaPortatil = Join-Path $DestinoBase "OREY_$nome"
    New-Item -ItemType Directory -Path $pastaPortatil -Force | Out-Null
    
    # Copiar conteudo
    robocopy $dir $pastaPortatil /E /NJH /NJS /NP /NDL /XD node_modules .next > $null
    if (Test-Path (Join-Path $dir ".next")) {
        robocopy (Join-Path $dir ".next") (Join-Path $pastaPortatil ".next") /E /NJH /NJS /NP > $null
    }
    if (Test-Path (Join-Path $dir "node_modules")) {
        robocopy (Join-Path $dir "node_modules") (Join-Path $pastaPortatil "node_modules") /E /NJH /NJS /NP > $null
    }
    
    # Criar .env especifico
    $authSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    @"
DATABASE_URL="file:$pastaPortatil\prisma\local.db"
NEXT_PUBLIC_APP_URL="http://localhost:$porto"
PORT=$porto
NODE_ENV=production
AUTH_SECRET="$authSecret"
NEXT_PUBLIC_REGIAO=$($estacao.Regiao)
"@ | Set-Content (Join-Path $pastaPortatil ".env") -Encoding UTF8
    
    Write-Host "  Pacote criado em $pastaPortatil" -ForegroundColor Green
}

Write-Host "=== CONCLUIDO ===" -ForegroundColor Green