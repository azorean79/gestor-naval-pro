@echo off
echo ============================================
echo    CONFIGURACAO FINAL - SUPABASE + VERCEL
echo ============================================
echo.
echo PASSO 1: SUPABASE (se ainda nao fez)
echo - Acesse: https://supabase.com
echo - Crie uma conta ou faca login
echo - Clique em "New project"
echo - Nome: gestor-naval-pro
echo - Database Password: (crie uma senha forte)
echo - Region: (escolha a mais proxima)
echo - Aguarde a criacao do projeto
echo.
echo PASSO 2: COPIAR CONNECTION STRING
echo - No painel do projeto, va em Settings ^> Database
echo - Copie a "Connection string" (URI)
echo - Deve ser algo como:
echo   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
echo.
echo PASSO 3: VERCEL ENVIRONMENT VARIABLES
echo - Acesse: https://vercel.com/dashboard
echo - Selecione seu projeto "gestor-naval-pro"
echo - Va em Settings ^> Environment Variables
echo - Adicione estas variaveis:
echo.
echo   DATABASE_URL = [cole aqui a connection string do Supabase]
echo   NEXTAUTH_SECRET = 3ycbIER5/+5hiPbNd4vNfhc0ADv7fEMuYQqmtNFPSU8=
echo   NEXTAUTH_URL = https://gestor-naval-pro.vercel.app
echo.
echo PASSO 4: DEPLOY
echo - Clique em "Deploy" no Vercel
echo - Aguarde o deploy terminar
echo.
echo PASSO 5: CONFIGURAR BANCO DE DADOS
echo - Execute o script POS-DEPLOY-GUIA.bat
echo.
pause