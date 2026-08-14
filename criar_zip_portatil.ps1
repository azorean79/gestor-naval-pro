param(
    [string]$NomeEstacao = "ACORES",
    [string]$DestinoZip = ""
)

$origem = switch ($NomeEstacao) {
    "ACORES" { "D:\Acores" }
    "AVELEDA" { "D:\AVELEDA" }
    "ALCANTARILHA" { "D:\ALCANTARILHA" }
    default { "D:\Acores" }
}

if (-not (Test-Path $origem)) {
    Write-Host "ERRO: $origem nao encontrada" -ForegroundColor Red
    exit 1
}

$data = Get-Date -Format "yyyyMMdd"
if (-not $DestinoZip) { $DestinoZip = Join-Path (Get-Location) "Orey_${NomeEstacao}_${data}.zip" }

Write-Host "A criar ZIP de $NomeEstacao ..." -ForegroundColor Cyan
Write-Host "Origem: $origem"
Write-Host "Destino: $DestinoZip"

$tempDir = Join-Path $env:TEMP "orey_zip_$([System.Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Excluir pastas grandes e ficheiros desnecessarios
    $excludeDirs = @('node_modules', '.next', '.git')
    $excludeFiles = @('*.zip', '*.7z', '*.rar', 'LER_ME_PORTATIL.txt')
    
    robocopy $origem $tempDir /E /NJH /NJS /NP /NDL /XD $excludeDirs /XF $excludeFiles > $null
    
    # Copiar .next e node_modules
    if (Test-Path (Join-Path $origem ".next")) {
        robocopy (Join-Path $origem ".next") (Join-Path $tempDir ".next") /E /NJH /NJS /NP > $null
    }
    if (Test-Path (Join-Path $origem "node_modules")) {
        robocopy (Join-Path $origem "node_modules") (Join-Path $tempDir "node_modules") /E /NJH /NJS /NP > $null
    }
    
    # Criar ZIP
    Add-Type -Assembly 'System.IO.Compression.FileSystem'
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $DestinoZip)
    
    $sizeMB = [math]::Round((Get-Item $DestinoZip).Length / 1MB, 1)
    Write-Host "ZIP criado: $DestinoZip ($sizeMB MB)" -ForegroundColor Green
}
finally {
    if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
}