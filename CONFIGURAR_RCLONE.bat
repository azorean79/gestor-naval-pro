@echo off
title Configurar rclone para Google Drive
cd /d "%~dp0"

echo ========================================
echo   Configurar rclone - Google Drive
echo ========================================
echo.
echo ATENCAO: NAO usar indices numericos no rclone
echo v1.74 (o indice 16 e "crypt", nao "drive").
echo.
echo O remote "gdrive" ja foi criado por script.
echo Se nao existir, crie manualmente assim:
echo   rclone config  - n - nome "gdrive" - no tipo
echo   digite a PALAVRA  drive  (nao um numero)
echo   Client ID/Secret: Enter (vazio)
echo   Scope: 1 (drive.file) - Enter nas restantes
echo   "y" para confirmar - "q" para sair
echo.
echo Agora basta AUTORIZAR o acesso ao Google
echo com a conta juliocrc@gmail.com:
echo.
echo   rclone config reconnect gdrive:
echo.
echo   (abre o browser - faca login e autorize;
echo    o token fica gravado no rclone.conf)
echo.
echo Depois execute SINCRONIZAR_GDRIVE_RCLONE.bat
echo.
pause
