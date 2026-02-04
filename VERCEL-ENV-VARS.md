# 📋 VARIÁVEIS DE AMBIENTE PARA VERCEL

## 🔴 OBRIGATÓRIAS:

### DATABASE_URL
**Valor:** `postgresql://username:password@host:port/database`
**Exemplo:** `postgresql://user123:senha456@db.postgres.com:5432/gestor_nav`
**Nota:** Use PostgreSQL com SSL habilitado

### NEXTAUTH_SECRET
**Como gerar:**
```bash
# Execute no terminal:
openssl rand -base64 32
# OU use: https://generate-secret.vercel.app/32
```
**Exemplo:** `L8m9PqR3sT7vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0z`

### NEXTAUTH_URL
**Valor:** `https://gestor-naval-pro.vercel.app`
**Nota:** Atualize com a URL real após o primeiro deploy

## 🟡 OPCIONAIS:

### OPENAI_API_KEY
**Valor:** `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
**Nota:** Necessário apenas para funcionalidades de IA

---

## ⚙️ CONFIGURAÇÕES DO VERCEL:

### Build Settings:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (raiz)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### Environment Variables:
Adicione todas as variáveis acima no dashboard do Vercel.

---

## 🗄️ OPÇÕES DE BANCO DE DADOS:

### Recomendadas para Vercel:
1. **Vercel Postgres** (Integrado)
2. **Supabase** (PostgreSQL gerenciado)
3. **Railway** (Simples e rápido)
4. **PlanetScale** (MySQL compatível)

### Após configurar banco:
```bash
npm run db:seed
```