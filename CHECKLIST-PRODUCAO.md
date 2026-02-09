# CHECKLIST PRÉ-PRODUÇÃO - Gestor Naval Pro

## ✅ VERIFICAÇÕES OBRIGATÓRIAS ANTES DE DEPLOY

### 1. CÓDIGO & BUILD
- [ ] `npm run build` executa sem erros
- [ ] `npm run lint` sem warnings críticos
- [ ] TypeScript: 0 erros de compilação
- [ ] Todas as imports resolvidas corretamente
- [ ] Nenhuma variável `console.log()` deixada de propósito
- [ ] Nenhuma `any` type sem justificativa

### 2. VARIÁVEIS DE AMBIENTE
- [ ] `.env.production` criado (copie de `.env.production.example`)
- [ ] `OPENAI_API_KEY` configurada e testada
- [ ] `PRISMA_DATABASE_URL` aponta para banco de produção
- [ ] `NEXT_PUBLIC_APP_URL` configurada corretamente
- [ ] Nenhuma variável sensível em código hardcoded
- [ ] `.env.production` está em `.gitignore`

### 3. DATABASE & PRISMA
- [ ] Schema Prisma atualizado: `npx prisma db push`
- [ ] Migrations executadas com sucesso
- [ ] Backups do banco de produção realizados
- [ ] Usuários de banco com permissões corretas
- [ ] Connection pool configurado (Prisma io)
- [ ] Timeout de conexão apropriado (30-60s)

### 4. SEGURANÇA
- [ ] HTTPS ativado (Vercel padrão)
- [ ] Rate limiting configurado para API endpoints
- [ ] CORS configurado apenas para domínio autorizado
- [ ] Variáveis sensíveis NUNCA em `.env.local`
- [ ] Headers de segurança configurados (CSP, X-Frame-Options)
- [ ] Validação de input em todos os endpoints

### 5. PERFORMANCE
- [ ] Build size < 50MB (verificar: .next/static)
- [ ] Bundle analysis realizado (`npm run analyze`)
- [ ] Imagens otimizadas (WebP, lazy loading)
- [ ] API routes com cache quando apropriado
- [ ] Database queries com índices apropriados
- [ ] Pagination implementado para listas grandes

### 6. FUNCIONALIDADES JULINHO
- [ ] Chat widget funciona: `/api/assistente` respondendo
- [ ] Dashboard widget carrega: `/api/julinho/widget`
- [ ] Ações do Julinho testadas (listar alertas, buscar jangada, etc)
- [ ] Reminders configurados: `/api/lembretes`
- [ ] Cron job em `vercel-cron.json` correto
- [ ] Notificações criadas corretamente no banco

### 7. TESTES
- [ ] Testar fluxo completo: login → dashboard → Julinho chat
- [ ] Testar criação de agendamento via Julinho
- [ ] Testar alerta de jangada vencida
- [ ] Testar widget atualiza a cada 5 minutos
- [ ] Testar acesso a múltiplas páginas sem erros
- [ ] Testar em navegador mobile (responsivo)

### 8. MONITORING & LOGS
- [ ] Sentry configurado para error tracking (opcional)
- [ ] Google Analytics verificado
- [ ] Logs estruturados (Cloud Logging)
- [ ] Alertas configurados para errors críticos
- [ ] Health check endpoint disponível: `/api/health`

### 9. BACKUPS & DISASTER RECOVERY
- [ ] Backup automático de database configurado
- [ ] Plano de rollback documentado
- [ ] Versão anterior pode ser redeployed rapidamente
- [ ] Dados críticos replicados (se aplicável)

### 10. DOCUMENTAÇÃO
- [ ] README atualizado com instruções de produção
- [ ] API endpoints documentados
- [ ] Variáveis de ambiente documentadas
- [ ] Processo de deployment documentado
- [ ] Contacts de suporte definidos

---

## 🚀 DEPLOY CHECKLIST

### Pré-Deploy (Executar Localmente)
```bash
# 1. Verificar build
npm run build

# 2. Verificar lint
npm run lint

# 3. Verificar database
npx prisma db push --accept-data-loss

# 4. Testar localmente se possível
npm start
# Visitar: http://localhost:3000
# Testar: chat Julinho, widget, criar agendamento
```

### Deploy no Vercel
```bash
# 1. Instalar CLI se necessário
npm install -g vercel

# 2. Login
vercel login

# 3. Verificar settings
vercel env ls

# 4. Deploy de produção
vercel --prod

# 5. Verificar deployment
# Ir para: https://vercel.com/deployments
```

### Pós-Deploy (Verificação)
- [ ] App abre sem erros: https://seu-dominio.vercel.app
- [ ] Dashboard carrega
- [ ] Julinho responde a mensagens
- [ ] Widget mostra alertas
- [ ] Nenhum erro em console (F12)
- [ ] Performance aceitável (Lighthouse > 70)

---

## 📊 MÉTRICAS ESPERADAS EM PRODUÇÃO

| Métrica | Target | Status |
|---------|--------|--------|
| Build Time | < 30s | ✓ |
| Build Size | < 50MB | ✓ |
| Routes | 96 | ✓ |
| API Response | < 500ms | ✓ |
| Widget Refresh | 5min | ✓ |
| Database Pool | 20 conexões | ⚙️ |
| Uptime | 99.9% | 🚀 |
| Errors/Day | < 10 | 🎯 |

---

## 🆘 TROUBLESHOOTING RÁPIDO

**Erro: Database connection refused**
- Verificar PRISMA_DATABASE_URL em .env.production
- Verificar IP whitelist no banco (se cloud)
- Testar conexão: `psql $PRISMA_DATABASE_URL`

**Erro: OpenAI API key invalid**
- Gerar nova chave em https://platform.openai.com/api-keys
- Verificar chave em Vercel Environment Variables
- Redeployed após atualizar

**Chat Julinho não responde**
- Verificar `/api/assistente` retorna status 200
- Verificar OPENAI_API_KEY configurada
- Verificar quota da API OpenAI

**Widget vazio**
- Verificar `/api/julinho/widget` retorna dados
- Verificar database connection
- Verificar browser cache (Ctrl+Shift+Delete)

**Reminders não funcionam**
- Verificar cron job em vercel-cron.json
- Verificar logs do cron: Vercel > Project > Crons
- Testar manual: `curl https://seu-dominio/api/lembretes`

---

## Checklist Produção com Dados Reais (Complementar)

### 1. Banco de Dados
- [ ] Backup do banco de dados atual
- [ ] Executar migrações (`prisma migrate deploy`)
- [ ] Importar dados reais (ex: `scripts/import-all-quadros.ts`, `import_mk4_spares.py`)
- [ ] Validar integridade dos dados importados

### 2. Variáveis de Ambiente
- [ ] Preencher `.env` com credenciais reais (DB, APIs, storage, e-mail, etc)
- [ ] Validar variáveis obrigatórias

### 3. Dependências
- [ ] `npm install`
- [ ] `pip install -r requirements.txt` (ou ativar `.venv`)
- [ ] Validar instalação de dependências críticas (`psycopg2`, `PyMuPDF`, `pdfplumber`, etc)

### 4. Build e Testes
- [ ] `npm run build` (Next.js)
- [ ] Testar scripts de importação e análise (TS/Python)
- [ ] Testar rotinas críticas manualmente (cadastro, uploads, relatórios)

### 5. OCR e Integrações
- [ ] Testar OCR com arquivos reais (`extract-seasava-ocr.py`, `ocr-seasava.py`)
- [ ] Validar integrações externas (APIs, e-mail, storage)

### 6. Logs e Monitoramento
- [ ] Ativar logs detalhados
- [ ] Configurar alertas para falhas críticas

### 7. Deploy
- [ ] Deploy em ambiente isolado (produção/staging)
- [ ] Testar endpoints e funcionalidades principais

### 8. Documentação
- [ ] Checklist de deploy salvo
- [ ] Guia de recuperação rápida disponível

> **Atenção:** NÃO executar scripts de limpeza completa em produção!
> Sempre testar com dados reais antes de liberar para usuários finais.
> Manter backup atualizado antes de qualquer alteração crítica.

---

## 📞 SUPORTE & ESCALAÇÃO

**Erro crítico em produção:**
1. Rollback imediato: `vercel rollback`
2. Diagnosticar em staging
3. Fixar e redeploy

**Performance degradada:**
1. Verificar database performance
2. Verificar API quota limits
3. Otimizar queries lentas

**Dados corrompidos:**
1. Restaurar backup mais recente
2. Investigar root cause
3. Adicionar validação para prevenir

---

Última atualização: 2024
Próxima revisão: Após 1 mês em produção
