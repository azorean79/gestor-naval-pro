@echo off
echo ========================================
echo 🚀 DEPLOY GESTOR NAVAL PRO PARA VERCEL
echo ========================================
echo.

cd "c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro"

echo 📋 PASSO 1: Verificando status do Git...
git status
echo.

echo 🔗 PASSO 2: Adicione o remote do GitHub
echo Execute: git remote add origin https://github.com/SEU_USERNAME/gestor-naval-pro.git
echo (substitua SEU_USERNAME pelo seu username do GitHub)
echo.
set /p remote_url="Cole aqui a URL do seu repositório GitHub: "

if "%remote_url%"=="" (
    echo ❌ URL não fornecida. Saindo...
    pause
    exit /b 1
)

git remote add origin %remote_url% 2>nul
if errorlevel 1 (
    echo ⚠️  Remote já existe ou erro. Tentando continuar...
)

echo.
echo 📤 PASSO 3: Fazendo push para GitHub...
git push -u origin master

if errorlevel 1 (
    echo ❌ Erro no push. Verifique se o repositório existe e você tem permissões.
    pause
    exit /b 1
)

echo.
echo ✅ PASSO 4: Código enviado para GitHub com sucesso!
echo.
echo 🌐 PRÓXIMOS PASSOS NO VERCEL:
echo 1. Acesse https://vercel.com
echo 2. Clique em "New Project"
echo 3. Importe o repositório "gestor-naval-pro"
echo 4. Configure as variáveis de ambiente:
echo    - DATABASE_URL: sua URL do PostgreSQL
echo    - NEXTAUTH_SECRET: gere uma string aleatória
echo    - NEXTAUTH_URL: https://seu-projeto.vercel.app
echo    - OPENAI_API_KEY: sua chave da OpenAI (opcional)
echo 5. Clique em "Deploy"
echo.
echo 🎉 Deploy concluído! Seu app estará online em alguns minutos.
echo.
pause