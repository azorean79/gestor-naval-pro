#!/bin/bash

# 🚀 GESTOR NAVAL PRO - DEPLOY VERCEL EM UMA LINHA
# Execute e siga as instruções na tela

# Verificar pré-requisitos
echo "🔍 Verificando pré-requisitos..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js não instalado. Instale em: https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm não instalado. Instale Node.js"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "⚠️  Vercel CLI não instalada. Instalando..."; npm install -g vercel; }
command -v git >/dev/null 2>&1 || { echo "❌ Git não instalado. Instale em: https://git-scm.com"; exit 1; }

echo "✅ Todos os pré-requisitos OK!"

# Compilar
echo ""
echo "🏗️  Compilando aplicação..."
npm run build || { echo "❌ Build falhou"; exit 1; }

echo "✅ Build bem-sucedido!"

# Menu
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY OPTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1) Deploy para Preview (Teste)"
echo "2) Deploy para Produção (REAL)"
echo "3) Testar Health Check"
echo "0) Cancelar"
echo ""
read -p "Escolha uma opção (0-3): " option

case $option in
    1)
        echo "📦 Iniciando deploy para preview..."
        vercel deploy
        ;;
    2)
        echo "⚠️  WARNING: Este é o deploy REAL em produção!"
        read -p "Tem certeza? (sim/nao): " confirm
        if [ "$confirm" = "sim" ]; then
            echo "🚀 Iniciando deploy para PRODUÇÃO..."
            vercel deploy --prod
        else
            echo "❌ Deploy cancelado"
        fi
        ;;
    3)
        echo "🏥 Testando health check..."
        curl -s https://gestor-naval-pro.vercel.app/api/health | grep -q "ok" && \
            echo "✅ Health check OK!" || \
            echo "❌ Aplicação não está respondendo"
        ;;
    0)
        echo "Cancelado"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Deploy completado!"
