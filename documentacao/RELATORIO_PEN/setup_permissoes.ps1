#Requires -RunAsAdministrator
<#
  SETUP DE PROTECAO DA PASTA RELATORIO_PEN
  -----------------------------------------
  Execute este script UMA VEZ como Administrador depois de copiar
  a pasta para a pen USB. Ele:
    1. Oculta a pasta _app (atributos Hidden + System)
    2. Aplica permissoes NTFS: so Administradores acedem a _app (apenas em NTFS)
    3. Oculta este proprio script
  Depois disso, so "ABRIR RELATORIO.vbs" fica visivel na raiz.
#>

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appFolder = Join-Path $scriptDir "_app"

Write-Host ""
Write-Host "=== Protecao da pasta RELATORIO_PEN ===" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------
# 1. Ocultar pasta _app com atributos Hidden + System
# -------------------------------------------------------
attrib +h +s "$appFolder"
Write-Host "  OK  Pasta _app ocultada (Hidden + System)" -ForegroundColor Green

# -------------------------------------------------------
# 2. Permissoes NTFS (so funciona em drives NTFS)
# -------------------------------------------------------
$drive     = Split-Path -Qualifier $scriptDir
$driveType = (Get-PSDrive -Name $drive.TrimEnd(':') -ErrorAction SilentlyContinue).Root
try {
    $driveInfo = [System.IO.DriveInfo]::new($drive + "\")
    $driveFormat = $driveInfo.DriveFormat
} catch {
    $driveFormat = "desconhecido"
}

if ($driveFormat -eq "NTFS") {
    # Remove heranca e garante que so Admins e SYSTEM chegam a _app
    icacls "$appFolder" /inheritance:d /T 2>&1 | Out-Null
    icacls "$appFolder" /remove:g "BUILTIN\Users" /T 2>&1 | Out-Null
    icacls "$appFolder" /remove:g "Everyone" /T 2>&1 | Out-Null
    icacls "$appFolder" /grant "BUILTIN\Administrators:(OI)(CI)F" /T 2>&1 | Out-Null
    icacls "$appFolder" /grant "NT AUTHORITY\SYSTEM:(OI)(CI)F" /T 2>&1 | Out-Null

    # Permite apenas leitura dos ficheiros por caminho directo
    # (necessario para o Edge abrir o HTML via o atalho VBS)
    # O "Bypass Traverse Checking" do Windows permite ao Edge aceder
    # ao ficheiro pelo caminho completo sem listar a pasta.
    Get-ChildItem "$appFolder" -Recurse -File | ForEach-Object {
        icacls $_.FullName /grant "BUILTIN\Users:(R)" 2>&1 | Out-Null
    }

    Write-Host "  OK  Permissoes NTFS aplicadas (acesso restrito a Administradores)" -ForegroundColor Green
} else {
    Write-Host "  !   Drive e $driveFormat (nao NTFS) - apenas atributos de ocultacao aplicados" -ForegroundColor Yellow
    Write-Host "      Para protecao total, formate a pen em NTFS." -ForegroundColor Yellow
}

# -------------------------------------------------------
# 3. Ocultar este script depois de correr
# -------------------------------------------------------
$scriptPath = $MyInvocation.MyCommand.Path
attrib +h +s "$scriptPath"
Write-Host "  OK  Script de setup ocultado" -ForegroundColor Green

Write-Host ""
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host "So 'ABRIR RELATORIO.vbs' e visivel na pasta." -ForegroundColor White
Write-Host ""
Write-Host "Para reverter (como Administrador):" -ForegroundColor DarkGray
Write-Host "  attrib -h -s `"$appFolder`"" -ForegroundColor DarkGray
Write-Host "  attrib -h -s `"$scriptPath`"" -ForegroundColor DarkGray
Write-Host ""
Start-Sleep -Seconds 4
