@echo off
title Sincronizador rclone - Google Drive (cifrado)
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo ========================================
echo   Sincronizador rclone - Google Drive
echo ========================================
echo.

if not exist "bin\rclone.exe" (
    echo ERRO: rclone nao encontrado em bin\
    pause
    exit /b 1
)

rem --- Ler configuracoes do .env ---
set "REMOTE=gdrive"
set "BACKUPS_PATH=OreyAcores_Backups"
set "CRYPT_BACKUPS="
if exist ".env" for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if /i "%%a"=="GDRIVE_REMOTE" set "REMOTE=%%b"
    if /i "%%a"=="GDRIVE_BACKUPS_PATH" set "BACKUPS_PATH=%%b"
    if /i "%%a"=="GDRIVE_CRYPT_BACKUPS_REMOTE" set "CRYPT_BACKUPS=%%b"
)

rem --- Determinar remote de backups (cifrado ou normal) ---
set "BTARGET=!REMOTE!:!BACKUPS_PATH!"
if defined CRYPT_BACKUPS (
    set "CB=!CRYPT_BACKUPS!"
    if "!CB:~-1!"==":" set "CB=!CB:~0,-1!"
    set "BTARGET=!CB!:"
)

rem --- Verificar remotes necessarios ---
bin\rclone.exe listremotes 2>&1 | findstr /C:"!REMOTE!:" >nul
if errorlevel 1 (
    echo ERRO: Remote '!REMOTE!' nao configurado.
    echo Execute CONFIGURAR_RCLONE.bat primeiro.
    pause
    exit /b 1
)
if defined CRYPT_BACKUPS (
    bin\rclone.exe listremotes 2>&1 | findstr /C:"!CB!:" >nul
    if errorlevel 1 (
        echo ERRO: Remote crypt '!CB!' nao configurado.
        echo Execute CONFIGURAR_RCLONE_CRYPT.bat primeiro.
        pause
        exit /b 1
    )
    echo Cifragem ATIVA - backups carregados cifrados via !CB!:
) else (
    echo Cifragem INATIVA - backups carregados em texto simples em !BTARGET!
)

echo.
echo A sincronizar com Google Drive a cada 60s...
echo Prima Ctrl+C para parar.
echo.

:Loop
echo [!DATE! !TIME!] A sincronizar...

rem Normalizar a hora (evitar espaco antes das 10h)
set "HH=!TIME:~0,2!"
if "!HH:~0,1!"==" " set "HH=0!HH:~1,1!"

rem Upload BD para Google Drive (uma copia com carimbo temporal)
rem Usa copyto (destino = ficheiro) - copy trataria o destino como pasta.
bin\rclone.exe copyto "prisma\local.db" "!BTARGET!\db_%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%_!HH!%TIME:~3,2%.db" --ignore-existing --verbose 1

rem Upload da pasta backups (os 5 mais recentes)
bin\rclone.exe copy "backups" "!BTARGET!\backups" --max-age 7d --verbose 1

echo [!DATE! !TIME!] OK - aguardar 60s...
timeout /t 60 /nobreak >nul
goto :Loop
