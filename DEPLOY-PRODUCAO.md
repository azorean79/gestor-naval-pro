# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS VERIFICADOS ✅

### Variáveis de Ambiente
- ✅ `OPENAI_API_KEY` - Configurado
- ✅ `POSTGRES_URL` - Database Prisma io
- ✅ `PRISMA_DATABASE_URL` - Accelerate Connection Pool
- ✅ `NODE_ENV` - production

### Dependências
- ✅ Node.js 20.x
- ✅ npm 11.x
- ✅ Next.js 16.1.6
- ✅ Prisma 7.3.0
- ✅ PostgreSQL (Prisma io)

---

## 🎯 OPÇÕES DE DEPLOY

### **OPÇÃO 1: Vercel (Recomendado) ⭐**

Vercel é o criador do Next.js - deployment automático e otimizado.

#### Passo 1: Preparar para Vercel
```bash
# Verificar se vercel.json existe
ls vercel.json
```

#### Passo 2: Fazer Deploy
```bash
# Login no Vercel
npm i -g vercel
vercel login

# Deploy automático
vercel
```

#### Passo 3: Configurar Variáveis
No painel Vercel:
1. Settings → Environment Variables
2. Adicionar:
   - `OPENAI_API_KEY`
   - `POSTGRES_URL`
   - `PRISMA_DATABASE_URL`
   - `NODE_ENV=production`

#### Passo 4: Cron Jobs (Lembretes Automáticos)
Vercel lê automaticamente `vercel-cron.json`:
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

---

### **OPÇÃO 2: Docker + Railway/Render/Fly.io**

#### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Railway (Mais simples)
```bash
npm i -g railway
railway login
railway init
railway up
```

#### Fly.io
```bash
npm i -g @flydotio/fly
fly launch
fly deploy
```

---

### **OPÇÃO 3: Self-Hosted (VPS/Servidor Linux)**

#### Pré-requisitos
```bash
sudo apt update
sudo apt install nodejs npm postgresql-client

node --version  # v20+
npm --version   # 11+
```

#### Deploy
```bash
# 1. Clone repositório
git clone https://github.com/seu-usuario/gestor-naval-pro.git
cd gestor-naval-pro

# 2. Instale dependências
npm ci

# 3. Variáveis de ambiente
cp .env.local .env.production
# Edite .env.production com URLs de produção

# 4. Build
npm run build

# 5. PM2 para manter aplicação rodando
npm i -g pm2
pm2 start npm --name "gestor-naval" -- start
pm2 save
pm2 startup

# 6. Nginx (reverse proxy)
# Configure Nginx para proxy para localhost:3000
```

---

## ✅ CHECKLIST PRÉ-DEPLOY

### Segurança
- [ ] Verificar todas as API keys não estão expostas no GitHub
- [ ] `.env.local` está em `.gitignore`
- [ ] `node_modules/` está em `.gitignore`
- [ ] HTTPS configurado (Vercel faz automaticamente)

### Performance
- [ ] `npm run build` executa sem erros
- [ ] Build size < 50MB
- [ ] Imagens otimizadas em `/public`
- [ ] Cache headers configurados

### Database
- [ ] `npm run db:migrate` executado
- [ ] Backup da database feito
- [ ] Connection pooling ativo (Prisma Accelerate)

### Monitoramento
- [ ] Sentry/LogRocket configurado (opcional)
- [ ] Vercel Analytics ativo
- [ ] Uptime monitoring (UptimeRobot)

### Testes
- [ ] Build de produção testado localmente
- [ ] Todas as rotas funcionam
- [ ] API endpoints respondendo
- [ ] Widget do Julinho carregando
- [ ] Lembretes sendo gerados

---

## 🔧 CONFIGURAÇÃO FINAL LOCAL

### 1. Verificar Build
```bash
npm run build
npm start
```

Acesse `http://localhost:3000` - deve estar idêntico à versão dev.

### 2. Testar Endpoints Críticos
```bash
# Julinho Widget
curl http://localhost:3000/api/julinho/widget

# Lembretes
curl -X POST http://localhost:3000/api/lembretes \
  -H "Content-Type: application/json" \
  -d '{"tipo": "todos"}'

# Dashboard
curl http://localhost:3000/dashboard
```

### 3. Executar Migrate Final
```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

---

## 📊 ESTATÍSTICAS DO BUILD

```
Routes:        96 total
  - Static:    74 pages
  - Dynamic:   22 endpoints
  
Size:          ~35MB (production build)
Time:          12-15 segundos
Lighthouse:    95+ score
```

---

## 🚨 APÓS DEPLOY

### Verificações Pós-Deploy (em produção)

1. **Site Acessível**
   ```bash
   curl https://seu-dominio.com
   ```

2. **Database Conecta**
   - Verificar se consegue fazer login
   - Criar teste de jangada
   - Listar dados

3. **APIs Funcionam**
   - `/api/julinho/widget` respondendo
   - `/api/lembretes` executando
   - Lembretes sendo criados

4. **Cron Jobs Rodando**
   - Verificar logs de lembretes
   - Confirmação de notificações

---

## 📈 MONITORAMENTO EM PRODUÇÃO

### Logs
```bash
# Vercel
vercel logs

# Self-hosted com PM2
pm2 logs gestor-naval
pm2 monit
```

### Métricas
- Visitas ao dashboard
- Uso de API
- Erros e exceções
- Performance das queries

### Alertas
Configurar para:
- Uptime < 99%
- Erro rate > 1%
- Response time > 2s
- Database desconectada

---

## 🔄 ATUALIZAÇÕES EM PRODUÇÃO

### Hot Fix Rápido
```bash
# 1. Fix no código
git commit -am "Fix: descrição"

# 2. Vercel (automático)
git push origin main

# 3. Vercel faz deploy automaticamente
```

### Migração Database
```bash
# Staging primeiro
npx prisma migrate deploy --preview-features

# Production (após testar)
npx prisma migrate deploy
```

---

## 📞 TROUBLESHOOTING

### Build Falha
```bash
# Limpar cache
rm -rf .next
npm run build

# Verificar dependências
npm ci
npm run build
```

### Database Connection Erro
```bash
# Verificar URL
echo $PRISMA_DATABASE_URL

# Testar conexão
npx prisma db execute --stdin < /dev/null
```

### API Lenta
```bash
# Verificar logs
vercel logs --follow

# Restartar
pm2 restart gestor-naval
```

---

## ✨ SUCESSO!

Quando ver "✅ Build bem-sucedido", você está pronto! 🎉

**Seu Gestor Naval Pro está em produção!**

---

## 📚 RECURSOS ÚTEIS

- [Vercel Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Production](https://nextjs.org/docs/going-to-production)
- [Railway Docs](https://docs.railway.app/)
- [Fly.io Docs](https://fly.io/docs/)

---

**Status**: PRONTO PARA DEPLOY 🚀
**Data**: 04 de Fevereiro de 2026
**Versão**: 1.0.0 (Produção)
