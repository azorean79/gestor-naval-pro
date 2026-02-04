@echo off
echo ============================================
echo    CONFIGURACAO RAPIDA - SUPABASE + VERCEL
echo ============================================
echo.
echo PASSO 1: COPIAR CONNECTION STRING DO SUPABASE
echo - Acesse: https://supabase.com/dashboard/project/efnqqzojujcwwxrkpqgp/settings/database
echo - Copie a "Connection string" (URI) completa
echo - Deve ser algo como:
echo   postgresql://postgres.efnqqzojujcwwxrkpqgp:[SENHA]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
echo.
echo PASSO 2: CONFIGURAR NO VERCEL
echo - Acesse: https://vercel.com/dashboard
echo - Selecione o projeto "gestor-naval-pro"
echo - Settings → Environment Variables
echo - Adicione ou atualize:
echo   DATABASE_URL = [cole aqui a connection string completa]
echo.
echo PASSO 3: DEPLOY
echo - Clique em "Deploy" no Vercel
echo - Aguarde o deploy terminar
echo.
echo ============================================
echo    APOS O DEPLOY:
echo ============================================
echo.
echo Execute o script POS-DEPLOY.bat para configurar o banco
echo.
pause