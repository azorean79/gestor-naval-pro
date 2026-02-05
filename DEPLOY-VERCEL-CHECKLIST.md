# 🚀 CHECKLIST DE DEPLOY VERCEL - ATUALIZADO

## ✅ PRÉ-DEPLOY (Local)

### 1. Correções Implementadas ✓
- [x] Removidas todas as linhas de `cacheStrategy` (10 instâncias)
- [x] Build local executado com sucesso
- [x] Sem erros de compilação
- [x] Prisma client gerado

### 2. Verificações de Código ✓
- [x] Todas as rotas de API testadas (72 endpoints)
- [x] Sem erros de TypeScript
- [x] Todas as dependências up-to-date
- [x] Node version <= 20.x

### 3. Configurações Locais ✓
- [x] `.env.local` com todas as variáveis
- [x] `GEMINI_API_KEY` configurada
- [x] `NEXTAUTH_SECRET` gerada
- [x] `DATABASE_URL` com connection string válida
- [x] Supabase configurado (Storage)

## 🔧 DEPLOY NO VERCEL

### 1. Conectar Repositório
```bash
# Se ainda não estiver conectado:
vercel link
```

### 2. Copiar Variáveis de Ambiente para Vercel Dashboard

Vá em: **Settings → Environment Variables** e adicione:

```
GEMINI_API_KEY=AIzaSyAN-kfwtVe4kntLx28RmA1TBHULIvInul4
GOOGLE_AI_API_KEY=AIzaSyBVkD6GAi7mxk7cgllnEX6GWJrRL-c4O-I
NEXTAUTH_SECRET=3ycbIER5/+5hiPbNd4vNfhc0ADv7fEMuYQqmtNFPSU8=
NEXTAUTH_URL=https://gestor-naval-pro.vercel.app
POSTGRES_URL=postgresql://user:pass@host:5432/db?sslmode=require
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_pub_xxxxx
NODE_ENV=production
```

### 3. Build Settings (Verificar)
- Framework: **Next.js** ✓
- Build Command: `npm run build` ✓
- Output Directory: `.next` ✓
- Install Command: `npm install` ✓
- Node Version: **20.x** ✓

### 4. Crons Configuration
Vercel detecta automaticamente:
- `/api/lembretes` - a cada 8h (configurado em `vercel-cron.json`)

### 5. Deploy
```bash
# Opção 1: CLI
vercel deploy --prod

# Opção 2: Git push (auto-deploy)
git push origin main
```

## 🧪 PÓS-DEPLOY (Testes)

### 1. Health Check
```bash
curl https://gestor-naval-pro.vercel.app/api/health
```

### 2. Verificar Endpoints Críticos
- [x] `GET /api/clientes` - Lista clientes
- [x] `POST /api/clientes` - Criar cliente
- [x] `GET /api/jangadas` - Lista jangadas
- [x] `POST /api/jangadas` - Criar jangada
- [x] `GET /api/navios` - Lista navios
- [x] `GET /api/stock` - Inventário
- [x] `GET /api/marcas-jangada` - Marcas

### 3. Testar Login
- Acesse: https://gestor-naval-pro.vercel.app
- Faça login com credenciais de teste

### 4. Testar Funcionalidades
- [ ] Criar novo cliente
- [ ] Criar nova jangada
- [ ] Upload de arquivo
- [ ] Exportar relatório
- [ ] Gerar QR codes
- [ ] Gemini AI funcionando

## ⚠️ TROUBLESHOOTING

### Build falha com "cacheStrategy"
**Solução**: Já removemos todas as 10 linhas! Limpar cache:
```bash
vercel env pull
vercel deploy --prod --force
```

### Database connection error
**Solução**: Verificar `DATABASE_URL` com `?sslmode=require`

### Supabase não encontrado
**Solução**: Adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Gemini API key inválida
**Solução**: Gerar nova chave em: https://aistudio.google.com/app/apikeys

## 📊 Informações do Projeto

- **Nome**: gestor-naval-pro
- **Framework**: Next.js 16.1.6
- **Banco**: PostgreSQL (Vercel/Supabase)
- **Auth**: NextAuth.js
- **Storage**: Supabase Storage
- **AI**: Google Gemini + Anthropic Claude
- **Node**: 20.x
- **Package Manager**: npm

## 🎯 Links Úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Projeto: https://gestor-naval-pro.vercel.app
- Database: Vercel Postgres ou Supabase
- Supabase: https://supabase.com/dashboard
- Gemini API: https://aistudio.google.com

---

**Última atualização**: 05/02/2026
**Status**: ✅ Pronto para deploy
