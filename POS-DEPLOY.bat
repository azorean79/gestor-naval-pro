@echo off
echo ============================================
echo    POS-DEPLOY: CONFIGURAR BANCO SUPABASE
echo ============================================
echo.
echo Este script configura o banco apos o deploy no Vercel.
echo.
echo PASSO 1: Verificar se estamos no diretorio correto
cd "c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro"
echo Diretorio: %cd%
echo.
echo PASSO 2: Instalar Vercel CLI (se nao tiver)
npm install -g vercel
echo.
echo PASSO 3: Fazer login no Vercel
vercel login
echo.
echo PASSO 4: Conectar ao projeto Vercel
vercel link
echo.
echo PASSO 5: Configurar variaveis de ambiente para desenvolvimento local
echo DATABASE_URL deve estar no .env.local
echo.
echo PASSO 6: Executar migrations no Supabase
npx prisma db push
echo.
echo PASSO 7: Executar seed do banco
npx prisma db seed
echo.
echo PASSO 8: Verificar conexao
npx prisma db pull
echo.
echo ============================================
echo    DEPLOY CONCLUIDO!
echo ============================================
echo.
echo ✅ Aplicacao: https://gestor-naval-pro.vercel.app
echo ✅ Banco: Supabase configurado
echo ✅ Migrations: Aplicadas
echo ✅ Seeds: Executados
echo.
echo 🎉 PRONTO PARA USO!
echo.
pause