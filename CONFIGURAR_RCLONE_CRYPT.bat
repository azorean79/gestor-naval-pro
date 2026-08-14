@echo off
title Ativar cifragem rclone (crypt) - Google Drive
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo ================================================
echo   Ativar cifragem da base de dados (rclone crypt)
echo ================================================
echo.

if not exist "bin\rclone.exe" (
    echo ERRO: bin\rclone.exe nao encontrado.
    pause
    exit /b 1
)

echo [1/4] A gerar password de cifragem...
powershell -NoProfile -Command "$p='Orey'+[char]45+[guid]::NewGuid().ToString('N').Substring(0,24);Set-Content -LiteralPath '.rclone-crypt-pass.txt' -Value $p -Encoding ASCII"
if errorlevel 1 (
    echo ERRO ao gerar password.
    pause
    exit /b 1
)
echo Password guardada em .rclone-crypt-pass.txt (NAO a perca).

echo.
echo [2/4] A criar remote orye_crypt (BD cifrada -> gdrive:OreyAcores)...
for /f "delims=" %%i in (.rclone-crypt-pass.txt) do set CRYPTPASS=%%i
if not defined CRYPTPASS (
    echo ERRO: nao foi possivel ler a password.
    pause
    exit /b 1
)

rem O rclone obscure grava a password cifrada no rclone.conf.
set "OBSC1="
for /f "delims=" %%i in ('bin\rclone.exe obscure "%CRYPTPASS%"') do set OBSC1=%%i
set "OBSC2="
for /f "delims=" %%i in ('bin\rclone.exe obscure "%CRYPTPASS%"') do set OBSC2=%%i

bin\rclone.exe config create orye_crypt crypt remote=gdrive:OreyAcores password="!OBSC1!" password2="!OBSC2!"
if errorlevel 1 (
    echo ERRO ao criar orye_crypt. Verifique se o remote "gdrive" existe.
    pause
    exit /b 1
)

echo [3/4] A criar remote orye_crypt_backups (backups cifrados -> gdrive:OreyAcores_Backups)...
bin\rclone.exe config create orye_crypt_backups crypt remote=gdrive:OreyAcores_Backups password="!OBSC1!" password2="!OBSC2!"
if errorlevel 1 (
    echo ERRO ao criar orye_crypt_backups.
    pause
    exit /b 1
)

echo [4/4] A ativar cifragem no .env...
setlocal DisableDelayedExpansion
if not exist ".env" type nul > ".env"
if exist ".env" (
    findstr /I /C:"GDRIVE_CRYPT_REMOTE=" ".env" >nul
    if errorlevel 1 (
        echo GDRIVE_CRYPT_REMOTE=orye_crypt>> ".env"
    )
    findstr /I /C:"GDRIVE_CRYPT_BACKUPS_REMOTE=" ".env" >nul
    if errorlevel 1 (
        echo GDRIVE_CRYPT_BACKUPS_REMOTE=orye_crypt_backups>> ".env"
    )
)

echo.
echo ================================================
echo   CIFRAGEM ATIVADA COM SUCESSO
echo ================================================
echo.
echo A base de dados e os backups passam a ser carregados
echo CIFRADOS no Google Drive.
echo.
echo IMPORTANTE - migracao dos ficheiros antigos:
echo   Os ficheiros ja existentes no Drive foram carregados
echo   SEM cifragem e NAO sao legiveis pelo remote crypt.
echo   Faca UMA vez (depois de confirmar que a copia cifrada
echo   funciona):
echo.
echo   1. node scripts\sync_gdrive.cjs --push   (carrega a BD cifrada)
echo   2. Confirme em https://drive.google.com que aparecem
echo      novos ficheiros com nomes cifrados em OreyAcores.
echo   3. Se estiver tudo ok, APAGUE os ficheiros antigos em
echo      texto simples de OreyAcores e OreyAcores_Backups,
echo      para que o remote crypt fique consistente.
echo.
echo GUARDE .rclone-crypt-pass.txt num local seguro - sem ele
echo NAO e possivel recuperar a base de dados do Drive.
echo.
pause
