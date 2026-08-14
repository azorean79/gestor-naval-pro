$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Gestor Naval Orey.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "D:\Acores\INICIAR.vbs"
$Shortcut.WorkingDirectory = "D:\Acores"
$Shortcut.Description = "Gestor Naval Orey Técnica Açores"
$Shortcut.IconLocation = "D:\Acores\app_icon.ico"
$Shortcut.Save()
Write-Host "Atalho criado com sucesso em: $ShortcutPath"
