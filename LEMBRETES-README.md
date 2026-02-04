# Sistema de Lembretes e Relatórios Automáticos

## 🔔 Visão Geral

Sistema completo de lembretes automáticos e relatórios semanais integrado com o Julinho.

## ✨ Funcionalidades Implementadas

### 1. **Lembretes de Agendamentos**
- ✅ Notificações para agendamentos do dia
- ✅ Lembretes 3 dias antes
- ✅ Priorização por urgência
- ✅ Criação automática de notificações

### 2. **Alertas de Jangadas**
- ✅ Jangadas com inspeção vencida (URGENTE)
- ✅ Jangadas que vencem em 15 dias (ALTA)
- ✅ Jangadas que vencem em 30 dias (MÉDIA)
- ✅ Integração com clientes

### 3. **Relatórios Semanais Automáticos**
- ✅ Estatísticas semanais:
  - Inspeções realizadas
  - Jangadas criadas
  - Agendamentos criados
  - Obras finalizadas
  - Movimentações de stock
- ✅ Geração automática toda segunda-feira
- ✅ Notificação no dashboard

### 4. **Widget do Julinho no Dashboard**
- ✅ Mensagem de bom dia personalizada
- ✅ Alertas críticos em tempo real
- ✅ Sugestões inteligentes
- ✅ Cards de resumo (4 métricas principais)
- ✅ Atualização automática a cada 5 minutos
- ✅ Design gradiente azul-roxo
- ✅ Priorização de alertas (urgente > alta > média > baixa)

## 🎯 Como Usar

### **Widget do Julinho**

Já está integrado no dashboard principal em `/dashboard`. Mostra:
- Agendamentos de hoje
- Jangadas próximas do vencimento (30 dias)
- Cilindros expirados
- Obras abertas
- Alertas críticos com badges de prioridade
- Sugestões com ações clicáveis

### **Lembretes Automáticos**

#### Manualmente via API:
```bash
# Enviar todos os lembretes
curl -X POST https://seu-dominio.com/api/lembretes \
  -H "Content-Type: application/json" \
  -d '{"tipo": "todos"}'

# Apenas lembretes de agendamentos
curl -X POST https://seu-dominio.com/api/lembretes \
  -H "Content-Type: application/json" \
  -d '{"tipo": "agendamentos"}'

# Apenas alertas de jangadas
curl -X POST https://seu-dominio.com/api/lembretes \
  -H "Content-Type: application/json" \
  -d '{"tipo": "jangadas_vencimento"}'

# Relatório semanal
curl -X POST https://seu-dominio.com/api/lembretes \
  -H "Content-Type: application/json" \
  -d '{"tipo": "relatorio_semanal"}'
```

#### Automaticamente (Vercel Cron):
O sistema está configurado para rodar automaticamente todos os dias às 8h (configurado em `vercel-cron.json`).

## 📊 Tipos de Notificações

### **Prioridade URGENTE** 🚨
- Jangadas com inspeção vencida
- Falhas críticas de sistema

### **Prioridade ALTA** ⚠️
- Agendamentos de hoje
- Jangadas que vencem em 15 dias
- Cilindros expirados

### **Prioridade MÉDIA** 📋
- Stock crítico
- Jangadas que vencem em 30 dias

### **Prioridade BAIXA** ℹ️
- Relatórios semanais
- Informações gerais

## 🔧 Arquivos Criados

1. **`/api/julinho/widget/route.ts`** - API do widget do Julinho
2. **`/api/lembretes/route.ts`** - Sistema de lembretes automáticos
3. **`/hooks/use-julinho-widget.ts`** - Hook React para o widget
4. **`/components/dashboard/julinho-widget.tsx`** - Componente visual
5. **`vercel-cron.json`** - Configuração de cron jobs

## 📅 Agendamento Automático

### Vercel Cron (Produção)
```json
{
  "crons": [
    {
      "path": "/api/lembretes",
      "schedule": "0 8 * * *"
    }
  ]
}
```
Executa todos os dias às 8h da manhã.

### Alternativas

#### GitHub Actions (se não usar Vercel):
```yaml
name: Lembretes Diários
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  enviar-lembretes:
    runs-on: ubuntu-latest
    steps:
      - name: Enviar lembretes
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/lembretes \
            -H "Content-Type: application/json" \
            -d '{"tipo": "todos"}'
```

#### Node-cron (local):
```javascript
const cron = require('node-cron');

// Todos os dias às 8h
cron.schedule('0 8 * * *', async () => {
  await fetch('http://localhost:3000/api/lembretes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: 'todos' })
  });
});
```

## 🎨 Widget do Julinho - Design

### Cores por Prioridade:
- **URGENTE**: Vermelho (bg-red-50, border-red-300)
- **ALTA**: Laranja (bg-orange-500)
- **MÉDIA**: Cinza (variant="secondary")
- **BAIXA**: Outline (variant="outline")

### Seções:
1. **Header** - Saudação personalizada + botão refresh
2. **Resumo Rápido** - 4 cards com métricas principais
3. **Alertas Críticos** - Lista ordenada por prioridade
4. **Sugestões** - Ações recomendadas pelo Julinho

## 📈 Métricas Rastreadas

### Widget em Tempo Real:
- Agendamentos de hoje
- Jangadas próximas vencimento (30 dias)
- Cilindros expirados
- Obras abertas
- Stock crítico

### Relatório Semanal:
- Inspeções realizadas
- Jangadas criadas
- Agendamentos criados
- Obras finalizadas
- Movimentações de stock

## 🚀 Próximos Passos

### A Implementar:
- [ ] Envio de emails (Nodemailer/SendGrid)
- [ ] SMS para alertas urgentes
- [ ] Push notifications (PWA)
- [ ] Integração WhatsApp Business
- [ ] Relatórios mensais
- [ ] Dashboard de analytics de lembretes

### Exemplo - Envio de Email:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

await transporter.sendMail({
  from: 'noreply@gestornaval.com',
  to: cliente.email,
  subject: `Lembrete: Jangada ${jangada.numeroSerie} vence em 15 dias`,
  html: `<p>A inspeção da jangada está próxima do vencimento.</p>`
});
```

## 💡 Dicas de Uso

1. **Visualizar Widget**: Acesse `/dashboard`
2. **Testar Lembretes**: `POST /api/lembretes` com `{"tipo": "todos"}`
3. **Ver Notificações**: Ícone de sino no header (se implementado)
4. **Configurar Cron**: Deploy no Vercel ativa automaticamente

## 🔒 Segurança

- ✅ Validação de tipos de lembrete
- ✅ Try-catch em todas as operações
- ✅ Logs de erro detalhados
- 🔄 Rate limiting (a implementar)
- 🔄 Autenticação API (a implementar)

## 📞 Suporte

Para questões sobre lembretes:
1. Verificar logs em `/api/lembretes` (GET para status)
2. Testar manualmente com POST
3. Verificar notificações criadas no dashboard

---

**Status**: ✅ IMPLEMENTADO E FUNCIONAL
**Próximo Deploy**: Ativa automaticamente o cron no Vercel
