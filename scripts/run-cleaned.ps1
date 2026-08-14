# PowerShell script to run match-and-associate
# This script is designed to work in the current PowerShell environment

# First, let's check if node is available
if (Get-Command node -ErrorAction SilentlyContinue) {
    # Change to the scripts directory
    Set-Location "D:\Acores\scripts"
    
    # Check if stock-import-data.json exists
    if (Test-Path "stock-import-data.json") {
        Write-Host "stock-import-data.json exists, running match-and-associate-cleaned.ts..."
        
        # Run the TypeScript script using npx
        node node_modules/.bin/tsx match-and-associate-cleaned.ts
    } else {
        Write-Host "ERROR: stock-import-data.json not found in scripts directory"
        exit 1
    }
} else {
    Write-Host "ERROR: Node.js is not available"
    exit 1
}