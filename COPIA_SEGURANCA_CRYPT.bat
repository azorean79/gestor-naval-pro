@echo off
title Copia de seguranca da password de cifragem (rclone crypt)
cd /d "%~dp0"
setlocal

echo ================================================
echo   COPIA DE SEGURANCA DA CIFRAGEM (IMPORTANTE)
echo ================================================
echo.
echo Este script copia para fora do PC:
echo   1. .rclone-crypt-pass.txt  - password de cifragem
echo   2. rclone.conf             - configuracao dos remotes
echo.
echo SEM a password NAO e possivel recuperar a base de
echo dados do Google Drive (esta cifrada).
echo.

set "SRC_CONF=%APPDATA%\rclone\rclone.conf"
set "SRC_PASS=.rclone-crypt-pass.txt"

if not exist "%SRC_PASS%" (
    echo ERRO: .rclone-crypt-pass.txt nao existe nesta pasta.
    echo       Execute primeiro CONFIGURAR_RCLONE_CRYPT.bat.
    pause
    exit /b 1
)
if not exist "%SRC_CONF%" (
    echo ERRO: rclone.conf nao encontrado em %SRC_CONF%
    pause
    exit /b 1
)

set "DEST=%~1"
if "%DEST%"=="" (
    echo Digite o destino (ex: E:\  ou  C:\Users\Orey\Documents\seguranca):
    set /p DEST=
)
if "%DEST%"=="" (
    echo ERRO: destino em branco.
    pause
    exit /b 1
)
if not exist "%DEST%" (
    echo ERRO: a pasta/letra %DEST% nao existe.
    pause
    exit /b 1
)

copy /Y "%SRC_PASS%" "%DEST%\.rclone-crypt-pass.txt" >nul
if errorlevel 1 (
    echo ERRO ao copiar a password.
    pause
    exit /b 1
)
copy /Y "%SRC_CONF%" "%DEST%\rclone.conf" >nul
if errorlevel 1 (
    echo ERRO ao copiar o rclone.conf.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   COPIA EFETUADA COM SUCESSO PARA %DEST%
echo ================================================
echo.
echo Ficheiros copiados:
echo   %DEST%\.rclone-crypt-pass.txt
echo   %DEST%\rclone.conf
echo.
echo IMPORTANTE - guarde num local seguro (USB, cofre,
echo casa, etc.) e, se possivel, faca DUAS copias.
echo.
echo Para recuperar num PC novo:
echo   1. Instale o rclone e copie o rclone.conf para
echo      %%APPDATA%%\rclone\rclone.conf
echo   2. Restaure a password em .rclone-crypt-pass.txt
echo   3. node scripts\testar_restauro.cjs   (verifica a copia)
echo   4. node scripts\sync_gdrive.cjs --pull (restaura a BD)
echo.
echo Depois de confirmar que a copia esta segura, pode apagar
echo estes ficheiros deste PC se assim preferir.
echo.
pause
