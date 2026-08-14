@echo off
title Orey Tecnica Acores - App
color 0A

cd /d "%~dp0"

:: Usar node portable se existir, senao o do sistema
set "NODE_CMD=node"
if exist "bin\node.exe" set "NODE_CMD=bin\node.exe"

:: Fechar instancia anterior na porta 3000
echo [INFO] A fechar instancia anterior...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Variaveis de ambiente
set "NODE_ENV=production"
set "PORT=3000"
set "HOSTNAME=0.0.0.0"

echo.
echo ============================================================
echo   OREY TECNICA Acores
echo   http://localhost:3000
echo ============================================================
echo.

:: Iniciar servidor (mantem a janela aberta com os logs)
"%NODE_CMD%" launcher.js

echo.
echo O servidor terminou. Prima uma tecla para fechar.
pause
