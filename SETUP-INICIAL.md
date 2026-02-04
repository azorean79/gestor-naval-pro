# 🔑 SETUP INICIAL - PRIMEIRO DEPLOY

## PASSO 1: Configurar OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Clique: "Create new secret key"
3. Copie a chave: `sk-proj-...`
4. Salve em local seguro (não compartilhe!)

## PASSO 2: Configurar Database (Vercel Postgres)

### Opção A: Usar Vercel Postgres (Recomendado)
1. Acesse: https://vercel.com/dashboard/stores
2. Clique: "Create Database" → "Postgres"
3. Nome: `gestor-naval-prod`
4. Região: `Americas` (mais perto)
5. Clique: "Create"
6. Copie: Connection String (em `.env.local`)

### Opção B: Usar Railway
1. Acesse: https://railway.app
2. Novo projeto
3. Selecione: PostgreSQL
4. Copie: Database URL
5. Salve em `.env.production`

### Opção C: Usar seu próprio servidor PostgreSQL
1. Server já deve estar rodando
2. URL formato: `postgresql://user:password@host:5432/dbname?sslmode=require`
3. Teste conexão: `psql $PRISMA_DATABASE_URL`

## PASSO 3: Criar arquivo .env.production

```bash
# Windows: Abrir gestor-naval-pro folder
# Criar arquivo: .env.production
# Copiar conteúdo abaixo e preencher:
```

```env
# ============ OBRIGATÓRIO ============

# OpenAI API Key (pegar em https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXX

# Database URL (pegar do Vercel Postgres ou seu servidor)
PRISMA_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# URL pública da sua app (mude para seu domínio)
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# ============ OPCIONAL ============

# Próximo Auth Secret (gere com: openssl rand -base64 32)
NEXTAUTH_SECRET=seu-secret-aqui

# Sentry para tracking de erros (opcional)
SENTRY_AUTH_TOKEN=seu-token

# Debug mode (false em produção)
NEXT_PUBLIC_DEBUG=false
```

## PASSO 4: Sincronizar Database Localmente

```bash
# Terminal na pasta gestor-naval-pro

# 1. Instalar dependências
npm ci

# 2. Gerar Prisma Client
npx prisma generate

# 3. Sincronizar schema com banco
npx prisma db push --accept-data-loss

# 4. Visualizar dados (opcional)
npx prisma studio
# Abre em: http://localhost:5555
```

## PASSO 5: Testar Localmente

```bash
# Build
npm run build

# Se OK, iniciar servidor
npm start

# Abrir em navegador:
# http://localhost:3000

# Testar:
# ✓ Carregar dashboard
# ✓ Chat Julinho funciona
# ✓ Widget mostra alertas
# ✓ Clicar em ação do widget
```

## PASSO 6: Configurar Vercel

### Via GitHub (Mais Fácil)
1. Fazer push para GitHub: `git push`
2. Ir para: https://vercel.com/new
3. Selecionar repositório
4. Em "Environment Variables", adicionar:
   - `OPENAI_API_KEY` = seu valor
   - `PRISMA_DATABASE_URL` = seu valor
5. Clicar: Deploy
6. Aguardar... (~2-3 minutos)
7. Pronto! 🎉

### Via Vercel CLI (Alternativa)
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Quando perguntar sobre .env:
#    "Do you want to add environment variables?"
#    Responda: Yes
#    Adicione cada variável
```

## PASSO 7: Configurar Custom Domain (Opcional)

```bash
# No Vercel Dashboard:
# 1. Ir para: Projeto > Settings > Domains
# 2. Adicionar: seu-dominio.com
# 3. Configurar DNS (Vercel fornece instruções)
# 4. Aguardar propagação (até 48 horas)

# Opção: Usar subdomain
# Mais rápido: seu-app.seu-dominio.com
```

## PASSO 8: Verificar Deploy

```bash
# 1. Abrir aplicação
https://seu-projeto.vercel.app

# 2. Checklist de verificação:
☐ App abre sem erros
☐ Dashboard carrega
☐ Clique em Julinho (chat widget)
☐ Escreva: "Olá Julinho"
☐ Julinho responde com mensagem de boas-vindas
☐ Clique em ação rápida (ex: "Ver Alertas")
☐ Widget mostra métricas e alertas
☐ F12 (Console): nenhum erro vermelho
```

## PASSO 9: Ativar Cron Jobs (Lembretes Automáticos)

Os cron jobs já estão configurados em `vercel-cron.json`

Para verificar status:
```bash
# No Vercel Dashboard:
# 1. Projeto > Crons
# 2. Ver status de /api/lembretes
# 3. Deve rodar diariamente às 8am UTC
```

## ⚠️ PROBLEMAS COMUNS

### "Database connection refused"
```
Solução:
1. Verificar PRISMA_DATABASE_URL em .env.production
2. Verificar IP whitelist no banco (se cloud)
3. Testar localmente: npx prisma db push
```

### "OpenAI API key invalid"
```
Solução:
1. Gerar nova key: https://platform.openai.com/api-keys
2. Verificar em Vercel: Settings > Environment Variables
3. Redeploy: vercel --prod
```

### "Chat Julinho não responde"
```
Solução:
1. F12 > Network > buscar /api/assistente
2. Ver se retorna status 200
3. Ver se OPENAI_API_KEY está configurada
4. Verificar quota OpenAI
```

### "Aplicação muito lenta"
```
Solução:
1. Verificar database performance (Prisma Studio)
2. Adicionar cache: `next/cache`
3. Verificar bundle size: `npm run build`
4. Monitorar em Vercel Analytics
```

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

### Dia 1
- [ ] Verificar app abre sem erros
- [ ] Testar todas as funcionalidades principais
- [ ] Verificar console (F12) limpo
- [ ] Testar em mobile

### Semana 1
- [ ] Monitorar performance (Vercel Analytics)
- [ ] Verificar cron jobs executando
- [ ] Coletar feedback de usuários
- [ ] Otimizar se necessário

### Mês 1
- [ ] Monitorar custos OpenAI
- [ ] Analisar usage patterns
- [ ] Preparar v2.0 com features
- [ ] Documentar melhorias

## 📊 MONITORAMENTO EM PRODUÇÃO

### Dashboard Vercel
- https://vercel.com/dashboard
- Logs em: Projeto > Logs
- Deployments: Projeto > Deployments
- Database: Vercel Postgres Admin

### Verificar Status Manual
```bash
# Health check
curl https://seu-dominio.vercel.app

# Ver logs Vercel
vercel logs seu-dominio.vercel.app

# Testar API
curl https://seu-dominio.vercel.app/api/julinho/widget

# Testar Cron
curl -X POST https://seu-dominio.vercel.app/api/lembretes
```

## 🔄 COMO FAZER UPDATE EM PRODUÇÃO

```bash
# 1. Fazer mudanças localmente
# 2. Testar com npm start
# 3. Fazer commit
git add .
git commit -m "Fix: descrição das mudanças"

# 4. Push para GitHub
git push

# 5. Vercel auto-deploys!
# Ou fazer manualmente:
vercel --prod

# 6. Verificar status em https://vercel.com/deployments
```

## 🆘 ROLLBACK (Voltar Versão Anterior)

```bash
# Se algo deu errado após deploy:
vercel rollback

# Volta para deployment anterior automaticamente!
```

---

## 📝 CHECKLIST FINAL

```
ANTES DE DEPLOY:
☐ .env.production com valores REAIS
☐ npm run build OK (exit code 0)
☐ Testes manuais OK
☐ Database sincronizado
☐ Backups realizados

DURANTE DEPLOY:
☐ Seguir passos acima
☐ Aguardar build completar
☐ Verificar status no Vercel

APÓS DEPLOY:
☐ App abre: https://seu-dominio
☐ Julinho responde
☐ Widget atualiza
☐ Console limpo
☐ Reminders vão rodar às 8am

ANTES DE USAR EM PRODUÇÃO:
☐ Todos os pontos acima ✓
☐ Monitorar 24h
☐ Backups configurados
☐ Suporte pronto
```

---

**Pronto para começar? 🚀**

Siga os passos acima e sua aplicação Gestor Naval Pro estará em produção em menos de 30 minutos!

Qualquer dúvida, consulte os outros documentos:
- `DEPLOY-RAPIDO.md` - Guia rápido (5 passos)
- `DEPLOY-PRODUCAO.md` - Guia completo
- `CHECKLIST-PRODUCAO.md` - Checklist detalhado
- `RESUMO-FINAL.md` - Resumo do que foi feito
