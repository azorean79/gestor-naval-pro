param(
    [string[]]$Estacoes = @("ACORES", "AVELEDA", "ALCANTARILHA")
)

$startupDir = [Environment]::GetFolderPath("Startup")
$WshShell = New-Object -ComObject WScript.Shell

foreach ($estacao in $Estacoes) {
    $srcDir = switch ($estacao) {
        "ACORES" { "D:\Acores" }
        "AVELEDA" { "D:\AVELEDA" }
        "ALCANTARILHA" { "D:\ALCANTARILHA" }
    }
    
    $batPath = Join-Path $srcDir "INICIAR_$estacao.bat"
    if (-not (Test-Path $batPath)) {
        Write-Host "Aviso: $batPath nao encontrado" -ForegroundColor Yellow
        continue
    }
    
    $shortcutPath = Join-Path $startupDir "Orey_$estacao.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "cmd.exe"
    $shortcut.Arguments = "/c `"$batPath`""
    $shortcut.WorkingDirectory = $srcDir
    $shortcut.Description = "Inicio automatico Orey $estacao"
    $shortcut.WindowStyle = 7
    $shortcut.Save()
    
    Write-Host "Arranque automatico configurado: $estacao" -ForegroundColor Green
}

Write-Host "Configurado arranque automatico para: $($Estacoes -join ', ')"