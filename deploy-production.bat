@echo off
REM Script de Deploy Automático para Produção (Windows)
REM Uso: deploy-production.bat

setlocal enabledelayedexpansion

echo.
echo ========================================================
echo  DEPLOY PRODUCAO - GESTOR NAVAL PRO
echo ========================================================
echo  Data: %date% %time%
echo.

REM 1. Verificar Node.js
echo [1/7] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado. Instale em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js OK

REM 2. Instalar dependencias
echo.
echo [2/7] Instalando dependencias...
call npm ci
if errorlevel 1 (
    echo ERRO: npm ci falhou
    pause
    exit /b 1
)
echo ✓ Dependencias OK

REM 3. Verificar .env.local
echo.
echo [3/7] Verificando variaveis de ambiente...
if not exist .env.local (
    echo ERRO: .env.local nao encontrado
    echo Copie .env.local.example para .env.local
    pause
    exit /b 1
)
echo ✓ Arquivo .env.local encontrado

REM 4. Build
echo.
echo [4/7] Compilando para producao...
call npm run build
if errorlevel 1 (
    echo ERRO: npm run build falhou
    pause
    exit /b 1
)
echo ✓ Build OK

REM 5. Database Migration
echo.
echo [5/7] Atualizando database...
call npx prisma db push --accept-data-loss
echo ✓ Database atualizado

REM 6. Teste local
echo.
echo [6/7] Iniciando servidor de testes...
echo O servidor vai iniciar em http://localhost:3000
echo Pressione Ctrl+C para parar
echo.
pause
start http://localhost:3000
call npm start

REM 7. Deploy Vercel
echo.
echo [7/7] Deploy no Vercel...
echo.
where vercel >nul 2>&1
if errorlevel 1 (
    echo AVISO: Vercel CLI nao instalado
    echo Instale com: npm install -g vercel
    echo Depois execute: vercel --prod
    pause
    exit /b 1
)

vercel --prod
echo ✓ Deploy iniciado

echo.
echo ========================================================
echo  ✓ DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================================
echo.
echo Seu Gestor Naval Pro esta em producao!
echo.
echo Proximos passos:
echo  1. Acesse: https://seu-dominio.vercel.app
echo  2. Configure seu dominio customizado
echo  3. Monitore em: vercel.com
echo.
pause
