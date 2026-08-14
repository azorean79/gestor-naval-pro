@echo off
chcp 65001 >nul
title Gestor Naval Pro - Parar Servidor
cd /d "%~dp0"

echo ====================================================
echo   PARAR SERVIDOR - GESTOR NAVAL PRO
echo ====================================================
echo.

echo A procurar processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo A parar processo PID: %%a
  taskkill /F /PID %%a >nul 2>&1
)
echo Servidor parado.
echo.

echo A procurar processos node.exe em execucao...
taskkill /F /IM node.exe >nul 2>&1
echo Processos Node terminados.
echo.

timeout /t 2 >nul
exit /b 0
