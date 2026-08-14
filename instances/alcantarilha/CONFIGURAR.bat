@echo off
title Orey Alcantarilha - Instance Config
cd /d "D:\ALCANTARILHA"

if not exist "D:\ALCANTARILHA\.next" (
    echo A configurar Alcantarilha pela primeira vez...
    
    if exist "D:\Acores\.next" (
        echo A copiar .next de D:\Acores...
        robocopy "D:\Acores\.next" "D:\ALCANTARILHA\.next" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\node_modules" (
        echo A copiar node_modules de D:\Acores...
        robocopy "D:\Acores\node_modules" "D:\ALCANTARILHA\node_modules" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\public" (
        echo A copiar public de D:\Acores...
        robocopy "D:\Acores\public" "D:\ALCANTARILHA\public" /E /NJH /NJS /NP >nul
    )
    if exist "D:\Acores\bin" (
        echo A copiar bin de D:\Acores...
        robocopy "D:\Acores\bin" "D:\ALCANTARILHA\bin" /E /NJH /NJS /NP >nul
    )
    
    echo Instalacao concluida.
    echo Pode agora executar INICIAR_ALCANTARILHA.bat
) else (
    echo Alcantarilha ja configurado.
)

pause
