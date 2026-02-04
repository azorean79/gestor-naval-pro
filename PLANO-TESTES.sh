#!/bin/bash

# 🧪 PLANO DE TESTES COMPLETO - GESTOR NAVAL PRO
# ================================================

echo "🚀 TESTES DO GESTOR NAVAL PRO COM GEMINI + SUPABASE"
echo "===================================================="
echo ""
echo "Status: Servidor rodando em http://localhost:3000"
echo ""

# TESTE 1: Julinho com Gemini
echo "✅ TESTE 1: JULINHO COM GEMINI"
echo "   1. Abra: http://localhost:3000/assistente-demo"
echo "   2. Clique no botão Julinho (canto inferior direito)"
echo "   3. Escreva: 'Olá, qual é o teu nome?'"
echo "   4. Deve responder com IA Gemini"
echo ""

# TESTE 2: Upload de Imagens (Supabase Storage)
echo "✅ TESTE 2: UPLOAD PARA SUPABASE STORAGE"
echo "   1. Abra: http://localhost:3000/stock"
echo "   2. Clique 'Adicionar novo item' ou upload"
echo "   3. Selecione uma imagem (PNG/JPG)"
echo "   4. Deve fazer upload para Supabase"
echo ""

# TESTE 3: Upload Múltiplo
echo "✅ TESTE 3: UPLOAD MÚLTIPLO"
echo "   1. Abra: http://localhost:3000/jangadas/import-quadro"
echo "   2. Selecione múltiplos ficheiros Excel (.xlsx)"
echo "   3. Clique 'Analisar e Importar'"
echo "   4. Gemini deve analisar em paralelo"
echo ""

# TESTE 4: Análise de Documentos
echo "✅ TESTE 4: ANÁLISE IA DE DOCUMENTOS"
echo "   1. Abra: http://localhost:3000 (ou endpoint de upload)"
echo "   2. Selecione ficheiros PDF/Excel"
echo "   3. Deve analisar com Gemini"
echo ""

# TESTE 5: CRUD Operações
echo "✅ TESTE 5: CRUD (Create, Read, Update, Delete)"
echo "   1. Abra: http://localhost:3000/jangadas"
echo "   2. Criar nova jangada"
echo "   3. Editar a jangada"
echo "   4. Deletar a jangada"
echo ""

echo "===================================================="
echo "📊 RESUMO DOS ENDPOINTS A TESTAR:"
echo "===================================================="
echo ""
echo "POST   /api/assistente           - Chat com Julinho"
echo "POST   /api/assistente/action    - Ações do Julinho"
echo "POST   /api/upload               - Upload para Supabase"
echo "POST   /api/documents/analyze    - Análise com Gemini"
echo "POST   /api/jangadas/import-quadro - Import Excel com Gemini"
echo "GET    /api/jangadas            - Listar jangadas"
echo "POST   /api/jangadas            - Criar jangada"
echo "PUT    /api/jangadas/[id]       - Editar jangada"
echo "DELETE /api/jangadas/[id]       - Deletar jangada"
echo ""
echo "===================================================="
echo "✨ Comece os testes agora! 🚀"
echo "===================================================="
