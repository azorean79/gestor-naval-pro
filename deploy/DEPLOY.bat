@echo off
title Deploy Orey Tecnica
echo ========================================
echo   Deploy Orey Tecnica
echo ========================================
echo.
echo Escolha a estacao para deploy:
echo 1 - Acores (localhost:3000)
echo 2 - Aveleda (localhost:3002)
echo 3 - Alcantarilha (localhost:3001)
echo.
set /p opcao="Opcao: "

if "%opcao%"=="1" set ESTACAO=ACORES
if "%opcao%"=="2" set ESTACAO=AVELEDA
if "%opcao%"=="3" set ESTACAO=ALCANTARILHA
if "%ESTACAO%"=="" (
    echo Opcao invalida
    pause
    exit /b 1
)

echo.
echo A fazer deploy de %ESTACAO%...
echo.
echo 1. Parar servidor atual
taskkill /f /im node.exe 2>nul

echo 2. Fazer build de producao
call npm run build

echo 3. Iniciar servidor
start "Orey %ESTACAO%" cmd /c "npx next start -p %PORTO%"

echo Deploy concluido para %ESTACAO%.
pause
