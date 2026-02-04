@echo off
echo ============================================
echo    CONNECTION STRING SUPABASE
echo ============================================
echo.
echo 📋 COPIE ESTA STRING PARA O VERCEL:
echo.
echo postgresql://postgres.efnqqzojujcwwxrkpqgp:[SUA_SENHA]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true^&connection_limit=1
echo.
echo ⚠️  IMPORTANTE:
echo - Substitua [SUA_SENHA] pela senha do seu projeto Supabase
echo - Esta eh a versao com CONNECTION POOLING (recomendada)
echo.
echo 🔗 Link direto para verificar:
echo https://supabase.com/dashboard/project/efnqqzojujcwwxrkpqgp/settings/database
echo.
echo ============================================
echo    PROXIMOS PASSOS:
echo ============================================
echo.
echo 1. Va no link acima e copie a connection string exata
echo 2. Acesse: https://vercel.com/dashboard
echo 3. Selecione o projeto "gestor-naval-pro"
echo 4. Settings ^> Environment Variables
echo 5. Adicione:
echo    DATABASE_URL = [connection string]
echo    NEXTAUTH_SECRET = 3ycbIER5/+5hiPbNd4vNfhc0ADv7fEMuYQqmtNFPSU8=
echo    NEXTAUTH_URL = https://gestor-naval-pro.vercel.app
echo 6. Clique em "Deploy"
echo.
pause