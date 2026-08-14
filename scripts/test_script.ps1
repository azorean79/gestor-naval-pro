# Simple test script to run match-and-associate
$ErrorActionPreference = "Stop"

# Navigate to scripts directory
Set-Location "D:\\Acores\\scripts"

# Check if stock-import-data.json exists and has content
if (Test-Path "stock-import-data.json") {
    $dataSize = (Get-Item "stock-import-data.json").Length
    Write-Host "stock-import-data.json exists with $dataSize bytes"
    
    if ($dataSize -gt 0) {
        Write-Host "File is not empty, running match-and-associate-cleaned.ts..."
        npx tsx match-and-associate-cleaned.ts
    } else {
        Write-Host "File is empty, creating test data..."
        $testData = @[
            @{ referncia = "TEST-001"; descricao = "Test Item 1"; categoria = "TEST"; quantidade = 10; precoVenda = 100; precoCompra = 80; codigoFabricante = "CODE-1"; localizacao = "LOC-1"; associavelJangada = $false; estadoArtigo = "NOVO" }
        ]
        $testData | ConvertTo-Json -Depth 3 | Set-Content "stock-import-data.json" -Encoding UTF8
        Write-Host "Created stock-import-data.json with test data"
        npx tsx match-and-associate-cleaned.ts
    }
} else {
    Write-Host "stock-import-data.json not found"
    Write-Host "Creating stock-import-data.json with test data..."
    $testData = @[
        @{ referncia = "TEST-001"; descricao = "Test Item 1"; categoria = "TEST"; quantidade = 10; precoVenda = 100; precoCompra = 80; codigoFabricante = "CODE-1"; localizacao = "LOC-1"; associavelJangada = $false; estadoArtigo = "NOVO" }
    ]
    $testData | ConvertTo-Json -Depth 3 | Set-Content "stock-import-data.json" -Encoding UTF8
    Write-Host "Created stock-import-data.json with test data"
    npx tsx match-and-associate-cleaned.ts
}
