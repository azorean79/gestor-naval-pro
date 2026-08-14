# Clean and run match-and-associate script

# Navigate to scripts directory
Set-Location "D:\Acores\scripts"

# Read the original match-and-associate.ts file
$originalContent = Get-Content "match-and-associate.ts" -Raw -Encoding UTF8

Write-Host "Original file size: $($originalContent.Length) bytes"

# Count duplicate declarations
$stockDataCount = ($originalContent | Select-String "const stockData: any[] = JSON.parse(" ).Matches.Count
$categoryMapCount = ($originalContent | Select-String "const CATEGORY_MAP: Record<string, string> = {" ).Matches.Count

Write-Host "stockData declarations: $stockDataCount"
Write-Host "CATEGORY_MAP declarations: $categoryMapCount"

# Clean the file by removing duplicate declarations
# Split into lines and process line by line
$lines = $originalContent.Split('\n')
$cleanedLines = @()
$stockDataDeclCount = 0
$categoryMapDeclCount = 0

foreach ($line in $lines) {
    if ($line -match "const stockData: any\[\] = JSON\.parse\(") {
        $stockDataDeclCount++
        if ($stockDataDeclCount -eq 1) {
            $cleanedLines += $line
            Write-Host "Kept stockData declaration #$stockDataDeclCount"
        } else {
            Write-Host "Removed duplicate stockData declaration #$stockDataDeclCount"
        }
    } elseif ($line -match "const CATEGORY_MAP: Record<string, string> = {") {
        $categoryMapDeclCount++
        if ($categoryMapDeclCount -eq 1) {
            $cleanedLines += $line
            Write-Host "Kept CATEGORY_MAP declaration #$categoryMapDeclCount"
        } else {
            Write-Host "Removed duplicate CATEGORY_MAP declaration #$categoryMapDeclCount"
        }
    } else {
        $cleanedLines += $line
    }
}

# Join cleaned lines
$cleanedContent = $cleanedLines -join '\n'

# Write cleaned version
$cleanedContent | Set-Content "match-and-associate-fixed.ts" -Encoding UTF8 -Force
Write-Host "\nCleaned script saved to match-and-associate-fixed.ts"

# Verify the cleaned file
$verifiedContent = Get-Content "match-and-associate-fixed.ts" -Raw -Encoding UTF8
$verifiedStockDataCount = ($verifiedContent | Select-String "const stockData: any[] = JSON.parse(").Matches.Count
$verifiedCategoryMapCount = ($verifiedContent | Select-String "const CATEGORY_MAP: Record<string, string> = {").Matches.Count

Write-Host "\n=== Verification ==="
Write-Host "stockData declarations after cleaning: $verifiedStockDataCount"
Write-Host "CATEGORY_MAP declarations after cleaning: $verifiedCategoryMapCount"

if ($verifiedStockDataCount -le 1 -and $verifiedCategoryMapCount -le 1) {
    Write-Host "\n✓ SUCCESS: No duplicate declarations found"
} else {
    Write-Host "\n✗ FAILURE: Duplicate declarations still present"
}

# Check for stock-import-data.json
if (Test-Path "stock-import-data.json") {
    $dataFile = Get-Item "stock-import-data.json"
    Write-Host "\n=== Stock Import Data ==="
    Write-Host "stock-import-data.json exists with $($dataFile.Length) bytes"
    
    if ($dataFile.Length -gt 0) {
        Write-Host "\nFile has content, running match-and-associate-fixed.ts..."
        npx tsx "match-and-associate-fixed.ts"
    } else {
        Write-Host "\nFile is empty. Creating sample data with 10 items..."
        $sampleData = @(
            @{ referncia = "TEST-001"; descricao = "Test Item 1"; categoria = "TEST"; quantidade = 10; precoVenda = 100; precoCompra = 80; codigoFabricante = "CODE-1"; localizacao = "LOC-1"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-002"; descricao = "Test Item 2"; categoria = "TEST"; quantidade = 20; precoVenda = 200; precoCompra = 160; codigoFabricante = "CODE-2"; localizacao = "LOC-2"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-003"; descricao = "Test Item 3"; categoria = "TEST"; quantidade = 30; precoVenda = 300; precoCompra = 240; codigoFabricante = "CODE-3"; localizacao = "LOC-3"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-004"; descricao = "Test Item 4"; categoria = "TEST"; quantidade = 40; precoVenda = 400; precoCompra = 320; codigoFabricante = "CODE-4"; localizacao = "LOC-4"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-005"; descricao = "Test Item 5"; categoria = "TEST"; quantidade = 50; precoVenda = 500; precoCompra = 400; codigoFabricante = "CODE-5"; localizacao = "LOC-5"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-006"; descricao = "Test Item 6"; categoria = "TEST"; quantidade = 60; precoVenda = 600; precoCompra = 480; codigoFabricante = "CODE-6"; localizacao = "LOC-6"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-007"; descricao = "Test Item 7"; categoria = "TEST"; quantidade = 70; precoVenda = 700; precoCompra = 560; codigoFabricante = "CODE-7"; localizacao = "LOC-7"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-008"; descricao = "Test Item 8"; categoria = "TEST"; quantidade = 80; precoVenda = 800; precoCompra = 640; codigoFabricante = "CODE-8"; localizacao = "LOC-8"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-009"; descricao = "Test Item 9"; categoria = "TEST"; quantidade = 90; precoVenda = 900; precoCompra = 720; codigoFabricante = "CODE-9"; localizacao = "LOC-9"; associavelJangada = $false; estadoArtigo = "NOVO" },
            @{ referncia = "TEST-010"; descricao = "Test Item 10"; categoria = "TEST"; quantidade = 100; precoVenda = 1000; precoCompra = 800; codigoFabricante = "CODE-10"; localizacao = "LOC-10"; associavelJangada = $false; estadoArtigo = "NOVO" }
        )
        
        $sampleData | ConvertTo-Json -Depth 3 | Set-Content "stock-import-data.json" -Encoding UTF8
        Write-Host "Created 10 sample items in stock-import-data.json"
        Write-Host "Running match-and-associate-fixed.ts with sample data..."
        npx tsx "match-and-associate-fixed.ts"
    }
} else {
    Write-Host "\n=== Stock Import Data ==="
    Write-Host "stock-import-data.json not found"
    Write-Host "Creating stock-import-data.json with 10 sample items..."
    $sampleData = @(
        @{ referncia = "TEST-001"; descricao = "Test Item 1"; categoria = "TEST"; quantidade = 10; precoVenda = 100; precoCompra = 80; codigoFabricante = "CODE-1"; localizacao = "LOC-1"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-002"; descricao = "Test Item 2"; categoria = "TEST"; quantidade = 20; precoVenda = 200; precoCompra = 160; codigoFabricante = "CODE-2"; localizacao = "LOC-2"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-003"; descricao = "Test Item 3"; categoria = "TEST"; quantidade = 30; precoVenda = 300; precoCompra = 240; codigoFabricante = "CODE-3"; localizacao = "LOC-3"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-004"; descricao = "Test Item 4"; categoria = "TEST"; quantidade = 40; precoVenda = 400; precoCompra = 320; codigoFabricante = "CODE-4"; localizacao = "LOC-4"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-005"; descricao = "Test Item 5"; categoria = "TEST"; quantidade = 50; precoVenda = 500; precoCompra = 400; codigoFabricante = "CODE-5"; localizacao = "LOC-5"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-006"; descricao = "Test Item 6"; categoria = "TEST"; quantidade = 60; precoVenda = 600; precoCompra = 480; codigoFabricante = "CODE-6"; localizacao = "LOC-6"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-007"; descricao = "Test Item 7"; categoria = "TEST"; quantidade = 70; precoVenda = 700; precoCompra = 560; codigoFabricante = "CODE-7"; localizacao = "LOC-7"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-008"; descricao = "Test Item 8"; categoria = "TEST"; quantidade = 80; precoVenda = 800; precoCompra = 640; codigoFabricante = "CODE-8"; localizacao = "LOC-8"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-009"; descricao = "Test Item 9"; categoria = "TEST"; quantidade = 90; precoVenda = 900; precoCompra = 720; codigoFabricante = "CODE-9"; localizacao = "LOC-9"; associavelJangada = $false; estadoArtigo = "NOVO" },
        @{ referncia = "TEST-010"; descricao = "Test Item 10"; categoria = "TEST"; quantidade = 100; precoVenda = 1000; precoCompra = 800; codigoFabricante = "CODE-10"; localizacao = "LOC-10"; associavelJangada = $false; estadoArtigo = "NOVO" }
    )
    
    $sampleData | ConvertTo-Json -Depth 3 | Set-Content "stock-import-data.json" -Encoding UTF8
    Write-Host "Created 10 sample items in stock-import-data.json"
    Write-Host "Running match-and-associate-fixed.ts..."
    npx tsx "match-and-associate-fixed.ts"
}
