@echo off
title Configurar Arranque Automatico - Orey Acores
cd /d "%~dp0"

echo ========================================
echo   Configurar Arranque Automatico
echo ========================================
echo.
echo Este script configura o Windows para
echo iniciar o servidor Orey Acores
echo automaticamente ao ligar o computador.
echo.
echo NOTA: O Node.js ja esta incluido na
echo pasta bin/, nao precisa instalacao.
echo.

:Menu
echo Escolha uma opcao:
echo.
echo  1 - Iniciar ao ligar o Windows (todos os users)
echo  2 - Iniciar ao ligar o Windows (apenas este user)
echo  3 - Remover arranque automatico
echo  4 - Sair
echo.

set /p OPCAO="Opcao: "
if "%OPCAO%"=="1" goto AllUsers
if "%OPCAO%"=="2" goto CurrentUser
if "%OPCAO%"=="3" goto Remove
if "%OPCAO%"=="4" exit /b
goto Menu

:AllUsers
echo.
echo A configurar arranque para todos os utilizadores...
schtasks /Create /SC ONLOGON /TN "OreyAcores" /TR "%~dp0INICIAR_ACORES.bat" /RL HIGHEST /F
if errorlevel 1 (
    echo ERRO: Tente executar como Administrador.
) else (
    echo SUCESSO: Orey Acores iniciara automaticamente!
)

goto End

:CurrentUser
echo.
echo A configurar arranque para o utilizador atual...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy "%~dp0INICIAR_ACORES.bat" "%STARTUP_DIR%\OreyAcores_Iniciar.bat" >nul
copy "%~dp0PARAR.bat" "%STARTUP_DIR%\OreyAcores_Parar.bat" >nul
echo SUCESSO: Atalhos adicionados a pasta de inicializacao.
echo.
echo NOTA: Os bativos estao em:
echo   %STARTUP_DIR%
goto End

:Remove
echo.
schtasks /Delete /TN "OreyAcores" /F >nul 2>&1
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_DIR%\OreyAcores_Iniciar.bat" del "%STARTUP_DIR%\OreyAcores_Iniciar.bat"
if exist "%STARTUP_DIR%\OreyAcores_Parar.bat" del "%STARTUP_DIR%\OreyAcores_Parar.bat"
echo Arranque automatico removido.
goto End

:End
echo.
pause
