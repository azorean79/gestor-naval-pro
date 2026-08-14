@echo off
title Preparar Orey Acores para E:
cd /d "%~dp0"

echo ========================================
echo   Preparar Orey Acores para E:
echo ========================================
echo.
echo Este script prepara a aplicacao para
echo funcionar na unidade E: (USB/Pendrive).
echo.
echo Requer: ~6 GB livres em E:
echo.

if not exist "E:\" (
    echo ERRO: Unidade E: nao encontrada
    pause
    exit /b 1
)

echo A copiar ficheiros (pode demorar alguns minutos)...
echo.

REM Copiar tudo exceto pastas grandes
robocopy "D:\Acores" "E:\Acores" /E /NJH /NJS /NP /NDL /XD .git .vercel backups terminal_logs server_prod.log node_modules .next > nul

REM Copiar node_modules (necessario para rebuild)
echo A copiar node_modules...
robocopy "D:\Acores\node_modules" "E:\Acores\node_modules" /E /NJH /NJS /NP /NDL > nul

REM Copiar bin (node.exe)
robocopy "D:\Acores\bin" "E:\Acores\bin" /E /NJH /NJS /NP /NDL > nul

echo.
echo Ficheiros copiados!
echo.
echo ========================================
echo   FAZER REBUILD EM E:
echo ========================================
echo.
echo Execute o comando abaixo para fazer o
echo rebuild na unidade E: (necessario para
echo que a aplicacao funcione nessa unidade):
echo.
echo   cd /d E:\Acores
echo   npx next build --webpack
echo.
echo Depois do build, execute:
echo   INICIAR.bat
echo.
echo A abrir E:\Acores no Explorador de Ficheiros...
explorer E:\Acores

pause
