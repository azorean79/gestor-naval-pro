@echo off
title Preparar Acores Portatil para USB
cd /d "D:\Acores"

echo ========================================
echo   Preparar Acores Portatil para USB
echo ========================================
echo.
echo Este script copia a aplicacao completa
echo para uma pen USB, incluindo Node.js.
echo Nao precisa instalar nada no PC de destino.
echo.
echo Requisito: ~6 GB livres na USB
echo.

set /p USB="Digite a letra da USB (ex: E): "
if "%USB%"=="" exit /b

if not exist "%USB%:\" (
    echo ERRO: Unidade %USB%: nao encontrada
    pause
    exit /b
)

set DESTINO=%USB%:\OREY_ACORES
echo.
echo A copiar para %DESTINO%...
echo.

if exist "%DESTINO%" rmdir /s /q "%DESTINO%"
mkdir "%DESTINO%"

REM Copiar tudo com robocopy (mais rapido que xcopy)
REM Excluir pastas desnecessarias para portabilidade
robocopy "D:\Acores" "%DESTINO%" /E /NJH /NJS /NP /NDL /XD .git .vercel backups terminal_logs temp

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo A aplicacao esta em %DESTINO%
echo.
echo Para usar em qualquer PC:
echo   1. Abrir %DESTINO%
echo   2. Executar INICIAR.bat
echo   3. Abrir http://localhost:3000
echo.
echo NOTA: Node.js ja incluido na pasta bin/
echo      Nao precisa instalar nada!
echo.
pause
