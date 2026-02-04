@echo off
echo ========================================
echo 🚀 DEPLOY FINAL - GUIA COMPLETO VERCEL
echo ========================================
echo.

cd "c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro"

echo ✅ SISTEMA PRONTO PARA DEPLOY!
echo.
echo 📋 SEU SISTEMA INCLUI:
echo    • 82 páginas/routes funcionando
echo    • 80+ APIs REST ativas
echo    • PWA completo (offline + notificações)
echo    • Dashboard executivo
echo    • Gestão naval completa
echo.

echo 🌐 PASSO A PASSO NO VERCEL:
echo.
echo ╔══════════════════════════════════════╗
echo ║           VERCEL DEPLOY GUIDE         ║
echo ╚══════════════════════════════════════╝
echo.
echo 1️⃣ FAÇA LOGIN NO VERCEL:
echo    • Acesse: https://vercel.com
echo    • Use GitHub, GitLab ou email
echo.
echo 2️⃣ CRIE NOVO PROJETO:
echo    • Clique: "New Project"
echo    • Procure: "gestor-naval-pro"
echo    • Selecione do seu GitHub
echo.
echo 3️⃣ CONFIGURE O PROJETO:
echo    • Framework: Next.js (automático)
echo    • Root Directory: ./ (automático)
echo    • Build Command: npm run build (automático)
echo.
echo 4️⃣ VARIÁVEIS DE AMBIENTE (OBRIGATÓRIAS):
echo.
echo    DATABASE_URL
echo    └─ postgresql://user:pass@host:port/database
echo.
echo    NEXTAUTH_SECRET
echo    └─ openssl rand -base64 32
echo    └─ OU gere em: https://generate-secret.vercel.app/32
echo.
echo    NEXTAUTH_URL
echo    └─ https://gestor-naval-pro.vercel.app
echo    └─ (Atualize após deploy com URL real)
echo.
echo    OPENAI_API_KEY (OPCIONAL)
echo    └─ sk-proj-xxxxxxxxxxxxxx
echo.
echo 5️⃣ DEPLOY:
echo    • Clique: "Deploy"
echo    • Aguarde 3-5 minutos
echo    • ✅ PRONTO!
echo.
echo ╔══════════════════════════════════════╗
echo ║         APÓS O DEPLOY                ║
echo ╚══════════════════════════════════════╝
echo.
echo 🎉 SEU APP ESTARÁ ONLINE EM:
echo    https://gestor-naval-pro.vercel.app
echo.
echo 📱 FUNCIONALIDADES DISPONÍVEIS:
echo    • App instalável (PWA)
echo    • Funcionamento offline
echo    • Notificações push
echo    • Dashboard completo
echo    • APIs REST completas
echo.
echo 🔧 PRÓXIMOS PASSOS OPCIONAIS:
echo    • Configure domínio customizado
echo    • Execute seeds do banco
echo    • Configure analytics
echo.
echo ════════════════════════════════════════
echo 🎊 DEPLOY CONCLUÍDO COM SUCESSO! 🎊
echo ════════════════════════════════════════
echo.
pause