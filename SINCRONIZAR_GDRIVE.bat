@echo off
title Sincronizador Automatico - Google Drive
cd /d "%~dp0"

echo ========================================
echo   Sincronizador Automatico Google Drive
echo ========================================
echo.
echo Este script sincroniza a base de dados
echo com o Google Drive automaticamente.
echo.
echo Requer:
echo   - Google Drive para Desktop instalado
echo     (https://www.google.com/drive/download/)
echo   - Pasta sincronizada no PC
echo.

setlocal enabledelayedexpansion

REM Detetar pasta do Google Drive
set GDRIVE=
for %%d in ("%USERPROFILE%\Google Drive" "%USERPROFILE%\My Drive" "G:\My Drive" "H:\My Drive") do (
    if exist "%%~d" set GDRIVE=%%~d
)

if not defined GDRIVE (
    for /f "tokens=2*" %%a in ('reg query "HKCU\Software\Google\Drive" /v "FolderPath" 2^>nul') do set GDRIVE=%%b
)

if not defined GDRIVE (
    echo [AVISO] Google Drive nao encontrado.
    echo A sincronizacao nao e obrigatoria - o servidor vai iniciar normalmente.
    echo Se pretender sincronizar mais tarde, instale Google Drive para Desktop
    echo (https://www.google.com/drive/download/) e volte a executar este script.
    echo.
    exit /b 0
)

set BACKUP_DIR=%GDRIVE%\OreyAcores_Backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Pasta Google Drive: %GDRIVE%
echo Pasta de backup: %BACKUP_DIR%
echo.

echo A sincronizar a cada 60 segundos...
echo Prima Ctrl+C para parar.
echo.

:Loop
REM Copiar BD para Google Drive
set DATA=%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set DATA=%DATA: =0%
set FILENAME=OreyAcores_%DATA%.db

copy "prisma\local.db" "%BACKUP_DIR%\%FILENAME%" >nul 2>&1
echo [%DATE% %TIME%] Backup enviado: %FILENAME%

REM Manter apenas os ultimos 100 backups no Google Drive
for /f "skip=100" %%f in ('dir "%BACKUP_DIR%\*.db" /b /o-d 2^>nul') do (
    del "%BACKUP_DIR%\%%f" >nul 2>&1
)

REM Se este PC nao tiver a BD principal, buscar a mais recente
if not exist "prisma\local.db" (
    for /f "delims=" %%f in ('dir "%BACKUP_DIR%\*.db" /b /o-d 2^>nul') do (
        copy "%BACKUP_DIR%\%%f" "prisma\local.db" >nul
        echo [%DATE% %TIME%] BD restaurada de: %%f
        goto :SkipRestore
    )
)
:SkipRestore

timeout /t 60 /nobreak >nul
goto :Loop