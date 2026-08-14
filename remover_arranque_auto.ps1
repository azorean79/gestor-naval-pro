param(
    [string[]]$Estacoes = @("ACORES", "AVELEDA", "ALCANTARILHA")
)

$startupDir = [Environment]::GetFolderPath("Startup")

foreach ($estacao in $Estacoes) {
    $shortcutPath = Join-Path $startupDir "Orey_$estacao.lnk"
    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
        Write-Host "Removido arranque automatico: $estacao" -ForegroundColor Yellow
    } else {
        Write-Host "Sem atalho para: $estacao" -ForegroundColor Gray
    }
}

Write-Host "Concluido."