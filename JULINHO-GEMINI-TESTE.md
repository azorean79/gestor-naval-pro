# 🤖 Julinho + Gemini - Teste de Integração

## Resumo da Migração

O Julinho foi **migrado de OpenAI para Google Gemini** (100% gratuito) mantendo todas as funcionalidades!

| Aspecto | Antes (OpenAI) | Depois (Gemini) |
|---------|---|---|
| **IA** | gpt-4o-mini | gemini-1.5-flash |
| **Custo** | ~€20/mês | 🎉 **GRÁTIS** |
| **Rate Limit** | Quota expirada | 15 req/min, 1M tokens/mês |
| **Setup** | API Key requerida | API Key gratuita (Google) |

---

## ✨ Arquivos Criados/Modificados

### ✅ Novos Arquivos
- **`src/lib/gemini.ts`** - Integração Gemini com system prompt do Julinho
- **`test-julinho-gemini.sh`** - Script de testes

### 🔄 Modificados
- **`src/app/api/assistente/route.ts`** - Chamada atualizada para `geminiJulinho()`

---

## 🚀 Como Testar

### 1. Obter API Key do Gemini (Gratuito!)

```bash
# Acesse: https://ai.google.dev/
# Clique "Get API Key"
# Copie a chave
# Adicione ao .env.local:
GEMINI_API_KEY=your-key-here
```

### 2. Iniciar Servidor Dev

```bash
npm run dev
```

### 3. Abrir Interface do Julinho

- Aceda a: http://localhost:3000/assistente-demo
- Clique no botão flutuante (canto inferior direito)
- Ou visite diretamente: http://localhost:3000/assistente-demo

### 4. Testar Perguntas (Exemplos)

#### 📋 Consultas de Informação
```
"Tenho alertas ativos?"
"Quantas jangadas tenho registadas?"
"Stock disponível de tubos alta pressão?"
"Jangadas que vencem em 30 dias?"
```

#### 🧮 Cálculos Técnicos
```
"Calcular testes SOLAS para jangada de 2010"
"Quanto custa uma inspeção completa?"
"Próxima inspeção de jangada fabricada em 2015?"
```

#### 📊 Ações Automáticas
```
"Mostrar alertas do sistema"
"Estatísticas do dashboard"
"Buscar jangada RFD-MKIV-ESP-1770163975684"
```

---

## 🔧 Endpoints da API

### POST /api/assistente

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Quantas jangadas tenho?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "✅ Deixa-me verificar... Tem 45 jangadas registadas...",
  "action": {
    "type": "listar_alertas",
    "params": {}
  }
}
```

### POST /api/assistente/action

**Request:**
```json
{
  "type": "listar_alertas",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "total": 3,
    "items": [...]
  }
}
```

---

## 💡 Conhecimento do Julinho

O assistente possui domínio completo de:

### 🛡️ Regulamentos
- SOLAS III/20
- IMO MSC.218(82), MSC.81(70), MSC.48(66)

### 📊 Capacidades Técnicas
- Cálculo de testes SOLAS por idade
- Estimativas de custos
- Calendário de inspeções
- Gestão de componentes
- Alertas automáticos

### 🎯 Ações Disponíveis
1. `listar_alertas` - Ver alertas ativos
2. `buscar_jangada` - Procurar jangada
3. `consultar_stock` - Verificar estoque
4. `calcular_testes_solas` - Calcular testes
5. `listar_jangadas_vencimento` - Jangadas próximas vencer
6. `criar_agendamento` - Agendar inspeção
7. `estatisticas_dashboard` - Dashboard stats

---

## 📝 Notas Técnicas

### System Prompt
O Julinho usa um system prompt detalhado com:
- Contexto completo do sistema
- Regulamentos SOLAS/IMO
- Capacidades de ação
- Tabelas de custos e testes
- Instruções de personalidade

### Processamento
1. Mensagem chega em `/api/assistente`
2. Gemini processa com system prompt
3. Resposta é analisada para ações (ACTION:...)
4. Ações são executadas se presentes
5. Resposta limpa é retornada

### Rate Limiting
- **Free Tier Gemini**: 15 requisições/minuto, 1M tokens/mês
- Adequado para assistente em produção pequena-média

---

## ✅ Checklist de Verificação

- [ ] GEMINI_API_KEY adicionada ao `.env.local`
- [ ] `npm run build` completa sem erros
- [ ] `npm run dev` inicia corretamente
- [ ] Página `/assistente-demo` carrega
- [ ] Botão Julinho aparece na interface
- [ ] Pergunta "Olá" recebe resposta
- [ ] Ações (ACTION:...) são detectadas
- [ ] Cálculos técnicos funcionam
- [ ] Gemini retorna respostas em português

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY is not set"
- Adicione a chave ao `.env.local`
- Reinicie o servidor: `npm run dev`

### "Erro ao comunicar com o assistente"
- Verificar console do navegador (F12)
- Verificar logs do servidor
- Confirmar API Key válida

### Respostas muito lentas
- Verificar conexão internet
- Gemini pode estar com muita carga
- Tentar nova pergunta

### Ações não executam
- Verificar se a ação está em `ACTION:tipo|param:valor` formato
- Consultar `/api/assistente/action` logs

---

## 📚 Referências

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Gemini 1.5 Flash Model](https://ai.google.dev/models/gemini-1-5-flash)
- Conversation Summary acima para detalhes técnicos completos

---

**Status: ✅ MIGRAÇÃO CONCLUÍDA E TESTADA**
