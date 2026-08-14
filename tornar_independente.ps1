param(
    [string]$NomeEstacao = "ESTACAO",
    [string]$Porto = "3000",
    [string]$Destino = "",
    [string]$Regiao = ""
)

$origem = "D:\Acores"
if (-not $Destino) { $Destino = "D:\$NomeEstacao" }

Write-Host "=== A criar estacao independente: $NomeEstacao ===" -ForegroundColor Cyan
Write-Host "Origem: $origem"
Write-Host "Destino: $Destino"
Write-Host "Porto: $Porto"

# Criar pasta destino
New-Item -ItemType Directory -Path $Destino -Force | Out-Null

# Copiar ficheiros da raiz
Get-ChildItem -Path $origem -File | Where-Object {
    $_.Name -notmatch '^INICIAR_' -and
    $_.Name -notmatch '^EMPACOTAR' -and
    $_.Name -notmatch '^PREPARAR' -and
    $_.Name -notmatch '^criar_' -and
    $_.Name -notmatch '^tornar_' -and
    $_.Name -notmatch '^check_' -and
    $_.Name -notmatch '^configurar_' -and
    $_.Name -notmatch '^remover_' -and
    $_.Name -notmatch '^instalar_' -and
    $_.Name -notmatch '^setup_' -and
    $_.Name -notmatch '^server-manager' -and
    $_.Name -notmatch '^launch_' -and
    $_.Name -notmatch '^LER_ME' -and
    $_.Name -notmatch '^_test_' -and
    $_.Name -notmatch '^_query_' -and
    $_.Name -notmatch '^_debug_' -and
    $_.Name -notmatch '^_fix_' -and
    $_.Name -notmatch '^_empresas_' -and
    $_.Name -notmatch '^_export_' -and
    $_.Name -notmatch '^_import_' -and
    $_.Name -notmatch 'build_' -and
    $_.Name -notmatch 'BUILD_' -and
    $_.Name -notmatch '^README' -and
    $_.Name -notmatch '^\.env\.' -and
    $_.Name -notmatch '^\.git' -and
    $_.Name -notmatch '^\.vercel' -and
    $_.Name -notmatch '^vercel\.' -and
    $_.Name -notmatch '^render\.' -and
    $_.Name -notmatch '\.pdf$' -and
    $_.Name -notmatch '\.docx$'
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $Destino $_.Name) -Force
}

# Copiar pastas essenciais
$pastas = @('prisma', 'public', 'src', 'scripts', 'bin', 'templates')
foreach ($p in $pastas) {
    $srcPath = Join-Path $origem $p
    if (Test-Path $srcPath) {
        Write-Host "A copiar $p ..."
        robocopy $srcPath (Join-Path $Destino $p) /E /NJH /NJS /NP /NDL > $null
    }
}

# Criar .env personalizado
$envContent = @"
DATABASE_URL="file:$Destino\prisma\local.db"
NEXT_PUBLIC_APP_URL="http://localhost:$Porto"
PORT=$Porto
NODE_ENV=production
AUTH_SECRET="$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % { [char]$_ }) )"
"@
if ($Regiao) { $envContent += "`NEXT_PUBLIC_REGIAO=$Regiao`n" }
Set-Content -Path (Join-Path $Destino ".env") -Value $envContent

# Criar INICIAR_ESTACAO.bat
$iniciarContent = @"
@echo off
title Orey $NomeEstacao - Porto $Porto
cd /d "$Destino"
echo ========================================
echo   Orey Tecnica $NomeEstacao
echo   http://localhost:$Porto
echo ========================================
npx next dev --webpack -H 0.0.0.0 -p $Porto
pause
"@
Set-Content -Path (Join-Path $Destino "INICIAR_$NomeEstacao.bat") -Value $iniciarContent

# Criar PARAR.bat
$pararContent = @"
@echo off
echo A parar $NomeEstacao...
taskkill /f /im node.exe 2>nul
echo Servidor parado.
pause
"@
Set-Content -Path (Join-Path $Destino "PARAR.bat") -Value $pararContent

# Criar CONFIGURAR.bat (para setup inicial)
$configurarContent = @"
@echo off
title Configurar $NomeEstacao
cd /d "$Destino"

if not exist "$Destino\.next" (
    echo A configurar $NomeEstacao pela primeira vez...
    if exist "$origem\.next" ( robocopy "$origem\.next" "$Destino\.next" /E /NJH /NJS /NP >nul )
    if exist "$origem\node_modules" ( robocopy "$origem\node_modules" "$Destino\node_modules" /E /NJH /NJS /NP >nul )
    if not exist "$Destino\node_modules" (
        echo node_modules nao encontrado. A instalar dependencias...
        cd /d "$Destino"
        npm install
    )
    echo Configuracao concluida.
) else (
    echo $NomeEstacao ja configurado.
)
pause
"@
Set-Content -Path (Join-Path $Destino "CONFIGURAR.bat") -Value $configurarContent

Write-Host "=== Estacao $NomeEstacao criada em $Destino ===" -ForegroundColor Green
Write-Host "1. Abra $Destino"
Write-Host "2. Execute CONFIGURAR.bat (apenas na primeira vez)"
Write-Host "3. Execute INICIAR_${NomeEstacao}.bat"