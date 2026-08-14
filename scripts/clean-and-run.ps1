# PowerShell script to clean and run match-and-associate
# Clean script by removing duplicate declarations

$content = Get-Content 'scripts/match-and-associate.ts' -Raw -Encoding UTF8

# Remove duplicate stockData declarations
$cleaned = $content -replace 'const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;\s*\n\s*const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;', '`$1'

# Remove duplicate CATEGORY_MAP declarations
$cleaned = $cleaned -replace 'const CATEGORY_MAP: Record<string, string> = \{[^{}]*\}\s*;\s*\n\s*const CATEGORY_MAP: Record<string, string> = \{[^{}]*\}\s*;', '`$1'

# Write cleaned version
$cleaned | Set-Content 'scripts/match-and-associate-cleaned.ts' -Encoding UTF8 -Force
Write-Host 'Cleaned script saved to match-and-associate-cleaned.ts'

# Check for data file
if (Test-Path 'scripts/stock-import-data.json') {
    Write-Host 'stock-import-data.json exists, running script...'
    npx tsx 'scripts/match-and-associate-cleaned.ts'
} else {
    Write-Host 'ERROR: stock-import-data.json not found in scripts directory'
    exit 1
}