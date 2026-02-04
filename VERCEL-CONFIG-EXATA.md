# 🚀 CONFIGURAÇÕES EXATAS PARA VERCEL

## 📋 COPIE E COLE NO VERCEL:

### Environment Variables (OBRIGATÓRIAS):

```
DATABASE_URL=postgresql://seu_usuario:sua_senha@seu_host:5432/seu_database
NEXTAUTH_SECRET=L8m9PqR3sT7vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0z
NEXTAUTH_URL=https://gestor-naval-pro.vercel.app
```

### Environment Variables (OPCIONAIS):

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔧 CONFIGURAÇÕES DO PROJETO (deixe como está):

### Build Settings:
- **Framework Preset:** Next.js ✅
- **Root Directory:** ./ ✅
- **Build Command:** npm run build ✅
- **Output Directory:** .next ✅
- **Install Command:** npm install ✅

---

## 🗄️ OPÇÕES DE BANCO DE DADOS:

### 1. Vercel Postgres (RECOMENDADO):
- Integrado diretamente
- Configure no Vercel Dashboard
- URL automática gerada

### 2. Supabase:
- Crie conta em: https://supabase.com
- Crie novo projeto
- Copie a connection string

### 3. Railway:
- Crie conta em: https://railway.app
- Crie novo projeto PostgreSQL
- Copie DATABASE_URL

### 4. PlanetScale:
- Crie conta em: https://planetscale.com
- Crie novo database
- Use connection string MySQL

---

## 🔑 COMO GERAR NEXTAUTH_SECRET:

### Opção 1 - Terminal:
```bash
openssl rand -base64 32
```

### Opção 2 - Online:
- Acesse: https://generate-secret.vercel.app/32
- Copie o resultado

### Opção 3 - Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ⚠️ DICAS IMPORTANTES:

1. **DATABASE_URL** deve incluir SSL (?sslmode=require)
2. **NEXTAUTH_URL** deve ser atualizado com a URL real após deploy
3. **NEXTAUTH_SECRET** deve ser único e secreto
4. Todas as variáveis são case-sensitive

---

## 🎯 RESULTADO ESPERADO:

Após deploy, você terá:
- ✅ App funcionando 24/7
- ✅ PWA instalável
- ✅ Funcionamento offline
- ✅ Notificações push
- ✅ APIs REST completas
- ✅ Dashboard executivo
- ✅ Sistema de inspeções
- ✅ Gestão naval completa