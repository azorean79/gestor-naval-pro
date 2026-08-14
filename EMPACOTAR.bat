@echo off
title Empacotar Estacao
echo ========================================
echo   Empacotar Estacao para ZIP
echo ========================================
echo.
echo Escolha a estacao:
echo 1 - Acores
echo 2 - Aveleda
echo 3 - Alcantarilha
echo 4 - Todas
echo.
set /p opcao="Opcao: "

if "%opcao%"=="1" call empacotar_estacao.bat ACORES
if "%opcao%"=="2" call empacotar_estacao.bat AVELEDA
if "%opcao%"=="3" call empacotar_estacao.bat ALCANTARILHA
if "%opcao%"=="4" (
    call empacotar_estacao.bat ACORES
    call empacotar_estacao.bat AVELEDA
    call empacotar_estacao.bat ALCANTARILHA
)
echo.
echo Concluido.
pause
