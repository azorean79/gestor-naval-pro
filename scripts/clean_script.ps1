# PowerShell script to clean match-and-associate.ts
# Create a simple PowerShell script file

$ErrorActionPreference = "Stop"

Write-Host "=== Cleaning match-and-associate.ts ==="

# Navigate to scripts directory
Set-Location "D:\Acores\scripts"

# Read the original file
$originalPath = "match-and-associate.ts"
$backupPath = "match-and-associate.ts.backup"
$fixedPath = "match-and-associate-fixed.ts"

# Create backup
Copy-Item $originalPath $backupPath -Force
Write-Host "Created backup: $backupPath"

# Read the content
$content = Get-Content $originalPath -Raw -Encoding UTF8
Write-Host "Original file size: $($content.Length) bytes"

# Check for duplicates
$stockDataMatches = [regex]::Matches($content, "const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;")
$categoryMapMatches = [regex]::Matches($content, "const CATEGORY_MAP: Record<string, string> = \{[^{}]+\}\s*;")

Write-Host "stockData occurrences: $($stockDataMatches.Count)"
Write-Host "CATEGORY_MAP occurrences: $($categoryMapMatches.Count)"

# Remove duplicate stockData declarations
# Use regex to remove consecutive duplicates
$cleaned = $content
$cleaned = [regex]::Replace($cleaned, "const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;\s*\n\s*const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;", "`$1")

# Remove duplicate CATEGORY_MAP declarations
$cleaned = [regex]::Replace($cleaned, "const CATEGORY_MAP: Record<string, string> = \[[^\]]+\]\s*;\s*\n\s*const CATEGORY_MAP: Record<string, string> = \[[^\]]+\]\s*;", "`$1")

# Write cleaned version
$cleaned | Set-Content $fixedPath -Encoding UTF8 -Force

Write-Host "\n=== Cleaning Complete ==="
Write-Host "Original size: $($content.Length) bytes"
Write-Host "Cleaned size: $($cleaned.Length) bytes"
Write-Host "Removed: $($content.Length - $cleaned.Length) bytes"

# Verify the cleaned file
$verified = Get-Content $fixedPath -Raw -Encoding UTF8
$verifiedStockDataCount = [regex]::Matches($verified, "const stockData: any\[\] = JSON\.parse\(").Count
$verifiedCategoryMapCount = [regex]::Matches($verified, "const CATEGORY_MAP: Record<string, string> = \{").Count

Write-Host "\n=== Verification ==="
Write-Host "stockData declarations after cleaning: $verifiedStockDataCount"
Write-Host "CATEGORY_MAP declarations after cleaning: $verifiedCategoryMapCount"

if ($verifiedStockDataCount -le 1 -and $verifiedCategoryMapCount -le 1) {
    Write-Host "\n✓ SUCCESS: No duplicate declarations found"
} else {
    Write-Host "\n✗ FAILURE: Duplicate declarations still present"
}

# Show first few lines
Write-Host "\n=== First 20 lines of cleaned file ==="
$lines = $verified.Split('\n')
for ($i = 0; $i -lt [Math]::Min(20, $lines.Count); $i++) {
    Write-Host "$($i + 1): $($lines[$i])"
}

# Check if stock-import-data.json exists
if (Test-Path "stock-import-data.json") {
    $dataSize = (Get-Item "stock-import-data.json").Length
    Write-Host "\n=== Stock Import Data ==="
    Write-Host "stock-import-data.json exists with $dataSize bytes"
} else {
    Write-Host "\n=== Stock Import Data ==="
    Write-Host "stock-import-data.json not found"
}
