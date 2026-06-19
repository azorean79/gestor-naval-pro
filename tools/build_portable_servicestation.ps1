$ErrorActionPreference = 'Stop'

$root = 'c:\Users\julio\Desktop\APLICACAO MASTER\oreyazores26'
$portable = Join-Path $root 'servistation 1.0'
$iconPng = Join-Path $portable 'servicestation-raft.png'
$iconIco = Join-Path $portable 'servicestation-raft.ico'
$runtimeDir = Join-Path $portable 'runtime'
$logsDir = Join-Path $portable 'logs'

Add-Type -AssemblyName System.Drawing

$robocopyArgs = @(
  $root,
  $portable,
  '/MIR',
  '/XD', '.git', '.github', '.venv', '.vercel', 'servistation 1.0',
  '/XF', '*.log',
  '/NFL', '/NDL', '/NJH', '/NJS', '/NP'
)
& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "Robocopy falhou com codigo $LASTEXITCODE"
}

New-Item -ItemType Directory -Force -Path $portable, $runtimeDir, $logsDir | Out-Null

$bmp = New-Object System.Drawing.Bitmap 256,256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255,245,248,252))

$seaBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,27,111,167))
$raftBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,123,37))
$innerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,236,210))
$ropePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,205,79,20), 10)
$wavePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,27,111,167), 8)
$whitePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White, 6)

$g.FillEllipse($seaBrush, 18, 18, 220, 220)
$g.FillEllipse($raftBrush, 48, 72, 160, 104)
$g.FillEllipse($innerBrush, 76, 98, 104, 52)
$g.DrawEllipse($ropePen, 48, 72, 160, 104)
$g.DrawLine($whitePen, 128, 58, 128, 188)
$g.DrawLine($whitePen, 98, 132, 158, 132)
$g.DrawArc($wavePen, 36, 164, 60, 28, 10, 160)
$g.DrawArc($wavePen, 88, 174, 78, 26, 10, 160)
$g.DrawArc($wavePen, 152, 164, 60, 28, 10, 160)
$bmp.Save($iconPng, [System.Drawing.Imaging.ImageFormat]::Png)

$pngBytes = [System.IO.File]::ReadAllBytes($iconPng)
$fs = [System.IO.File]::Open($iconIco, [System.IO.FileMode]::Create)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([byte[]](0,0,1,0,1,0))
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([byte]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]32)
$bw.Write([UInt32]$pngBytes.Length)
$bw.Write([UInt32]22)
$bw.Write($pngBytes)
$bw.Flush()
$bw.Close()
$fs.Close()

Copy-Item 'C:\Program Files\nodejs\node.exe' (Join-Path $runtimeDir 'node.exe') -Force

$launcherPath = Join-Path $portable 'SERVICESTATION 1.0.cmd'
$launcherContent = @'
@echo off
setlocal
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%start_oreyazores.ps1"
endlocal
'@
Set-Content -Path $launcherPath -Value $launcherContent -Encoding ASCII

$ws = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $portable 'SERVICESTATION 1.0.lnk'
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $portable
$shortcut.IconLocation = "$iconIco,0"
$shortcut.Description = 'Abrir SERVICESTATION 1.0'
$shortcut.Save()

Write-Output "Portable folder prepared: $portable"
Write-Output "Launcher created: $launcherPath"
Write-Output "Shortcut created: $shortcutPath"
Write-Output "Icon created: $iconIco"
