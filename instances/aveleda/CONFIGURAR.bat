@echo off
title Orey Aveleda - Instance Config
cd /d "D:\AVELEDA"

if not exist "D:\AVELEDA\.next" (
    echo A configurar Aveleda pela primeira vez...
    
    if exist "D:\Acores\.next" (
        echo A copiar .next de D:\Acores...
        robocopy "D:\Acores\.next" "D:\AVELEDA\.next" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\node_modules" (
        echo A copiar node_modules de D:\Acores...
        robocopy "D:\Acores\node_modules" "D:\AVELEDA\node_modules" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\public" (
        echo A copiar public de D:\Acores...
        robocopy "D:\Acores\public" "D:\AVELEDA\public" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\bin" (
        echo A copiar bin de D:\Acores...
        robocopy "D:\Acores\bin" "D:\AVELEDA\bin" /E /NJH /NJS /NP >nul
    )
    
    echo Instalacao concluida.
    echo Pode agora executar INICIAR_AVELEDA.bat
) else (
    echo Aveleda ja configurado.
)

pause
