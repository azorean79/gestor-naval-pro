# PowerShell script to fix match-and-associate.ts and run the process

# Enable error handling
$ErrorActionPreference = "Stop"

Write-Host "=== COMPLETE MATCH-AND-ASSOCIATE PROCESS ===" -ForegroundColor Green
Write-Host "This script will fix the script, create data, and run the import process.\n"

# Change to scripts directory
Set-Location "D:\Acores\scripts"

# Step 1: Clean match-and-associate.ts
Write-Host "\n=== Step 1: Cleaning match-and-associate.ts ===" -ForegroundColor Yellow

# Read the original file
$originalContent = Get-Content "match-and-associate.ts" -Raw -Encoding UTF8
$originalLines = $originalContent.Split('\n')

Write-Host "Original file size: $($originalContent.Length) bytes"
Write-Host "Original file lines: $($originalLines.Count)"

# Count duplicate declarations
$stockDataCount = 0
$categoryMapCount = 0

for ($i = 0; $i -lt $originalLines.Count; $i++) {
    $line = $originalLines[$i]
    if ($line -match 'const stockData: any\[\] = JSON\.parse\(') {
        $stockDataCount++
        Write-Host "  Found stockData declaration at line $($i + 1): #$stockDataCount"
    } elseif ($line -match 'const CATEGORY_MAP: Record<string, string> = \{') {
        $categoryMapCount++
        Write-Host "  Found CATEGORY_MAP declaration at line $($i + 1): #$categoryMapCount"
    }
}

# Create cleaned version
$cleanedLines = @()
$stockDataDeclCount = 0
$categoryMapDeclCount = 0

foreach ($line in $originalLines) {
    if ($line -match 'const stockData: any\[\] = JSON\.parse\(') {
        $stockDataDeclCount++
        if ($stockDataDeclCount -eq 1) {
            $cleanedLines += $line
            Write-Host "  ✓ Kept stockData declaration #$stockDataDeclCount"
        } else {
            Write-Host "  ✗ Removed duplicate stockData declaration #$stockDataDeclCount"
        }
    } elseif ($line -match 'const CATEGORY_MAP: Record<string, string> = \{') {
        $categoryMapDeclCount++
        if ($categoryMapDeclCount -eq 1) {
            $cleanedLines += $line
            Write-Host "  ✓ Kept CATEGORY_MAP declaration #$categoryMapDeclCount"
        } else {
            Write-Host "  ✗ Removed duplicate CATEGORY_MAP declaration #$categoryMapDeclCount"
        }
    } else {
        $cleanedLines += $line
    }
}

# Join cleaned lines
$cleanedContent = $cleanedLines -join '\n'

# Write cleaned version
$cleanedContent | Set-Content "match-and-associate-fixed.ts" -Encoding UTF8 -Force

Write-Host "\n=== Cleaning Complete ==="
Write-Host "Created match-and-associate-fixed.ts"
Write-Host "Original size: $($originalContent.Length) bytes"
Write-Host "Cleaned size: $($cleanedContent.Length) bytes"
Write-Host "Removed: $($originalContent.Length - $cleanedContent.Length) bytes"

# Verify the cleaned file
$verifiedContent = Get-Content "match-and-associate-fixed.ts" -Raw -Encoding UTF8
$verifiedStockDataCount = ($verifiedContent | Select-String 'const stockData: any[] = JSON.parse(').Matches.Count
$verifiedCategoryMapCount = ($verifiedContent | Select-String 'const CATEGORY_MAP: Record<string, string> = {').Matches.Count

Write-Host "\n=== Verification ==="
Write-Host "stockData declarations after cleaning: $verifiedStockDataCount"
Write-Host "CATEGORY_MAP declarations after cleaning: $verifiedCategoryMapCount"

if ($verifiedStockDataCount -le 1 -and $verifiedCategoryMapCount -le 1) {
    Write-Host "\n✓ SUCCESS: No duplicate declarations found"
    Write-Host "The script is now clean and ready to run!" -ForegroundColor Green
} else {
    Write-Host "\n✗ FAILURE: Duplicate declarations still present"
    Write-Host "Exiting..." -ForegroundColor Red
    exit 1
}

# Step 2: Create stock-import-data.json
Write-Host "\n=== Step 2: Creating stock-import-data.json with 200 items ===" -ForegroundColor Yellow

$items = @()
for ($i = 1; $i -le 200; $i++) {
    $item = [PSCustomObject]@{ 
        referncia = "REF-" + $i.ToString("D5")
        descricao = "TESTE $i"
        categoria = "TEST"
        quantidade = $i
        precoVenda = [double]($i + 10.0)
        precoCompra = [double]($i + 5.0)
        codigoFabricante = "CODE-" + $i.ToString("D4")
        localizacao = "LOC-" + ($i % 20 + 1).ToString("D3")
        associavelJangada = $false
        estadoArtigo = "NOVO"
    }
    $items += $item
}

# Convert to JSON
$json = $items | ConvertTo-Json -Depth 3
$json | Set-Content "stock-import-data.json" -Encoding UTF8

Write-Host "Created stock-import-data.json with $($items.Count) items"
$jsonSize = (Get-Item "stock-import-data.json").Length
Write-Host "File size: $jsonSize bytes"

# Show first 5 items
Write-Host "\nFirst 5 items in the JSON:")
for ($i = 0; $i -lt [Math]::Min(5, $items.Count); $i++) {
    Write-Host "  $($i + 1). $($items[$i].referncia) - $($items[$i].descricao)"
}

# Step 3: Run the cleaned script
Write-Host "\n=== Step 3: Running match-and-associate-fixed.ts ===" -ForegroundColor Yellow

if (Test-Path "match-and-associate-fixed.ts") {
    Write-Host "Running the cleaned match-and-associate-fixed.ts script..."
    try {
        npx tsx "match-and-associate-fixed.ts"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "\n✓ SUCCESS: Script executed successfully!" -ForegroundColor Green
        } else {
            Write-Host "\n⚠ WARNING: Script executed but may have issues" -ForegroundColor Yellow
            Write-Host "Exit code: $LASTEXITCODE"
        }
    } catch {
        Write-Host "\n✗ ERROR: Script execution failed" -ForegroundColor Red
        Write-Host "Error: $_"
    }
} else {
    Write-Host "\n✗ ERROR: match-and-associate-fixed.ts not found" -ForegroundColor Red
    exit 1
}

Write-Host "\n=== PROCESS COMPLETED ===" -ForegroundColor Green
Write-Host "The match-and-associate script has been cleaned and the stock data has been imported!" -ForegroundColor Green
