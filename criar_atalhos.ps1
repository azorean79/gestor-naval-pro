param(
    [string[]]$Estacoes = @("ACORES", "AVELEDA", "ALCANTARILHA")
)

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
    
    $shortcutPath = [Environment]::GetFolderPath("Desktop") + "\Orey $estacao.lnk"
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "cmd.exe"
    $shortcut.Arguments = "/c `"$batPath`""
    $shortcut.WorkingDirectory = $srcDir
    $shortcut.Description = "Iniciar Orey $estacao"
    $shortcut.Save()
    
    Write-Host "Atalho criado: $shortcutPath" -ForegroundColor Green
}

Write-Host "Atalhos criados para: $($Estacoes -join ', ')"