# 🚀 START HERE - Deployment Instructions

## ⚡ Quick Deployment (40 minutes)

Siga estes passos para fazer o deployment da aplicação no Vercel:

---

## 📋 PASSO 1: Configurar Supabase (15 minutos)

### 1.1 Criar Conta e Projeto
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub
4. Clique em "New Project"
5. Preencha:
   - **Name**: `gestor-naval-pro`
   - **Database Password**: Crie uma senha FORTE (guarde!)
   - **Region**: Europe West (Ireland)
6. Clique em "Create new project"
7. Aguarde ~2 minutos

### 1.2 Configurar Storage
1. No menu lateral → **Storage**
2. Clique em "Create a new bucket"
3. Preencha:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Marcar
4. Clique em "Create bucket"

### 1.3 Adicionar Políticas de Acesso
1. Clique no bucket `uploads`
2. Aba **Policies**
3. Clique em "New Policy"
4. Cole este SQL no editor:

```sql
-- Permitir upload público
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

-- Permitir leitura pública
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Permitir atualização pública
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'uploads');

-- Permitir exclusão pública
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'uploads');
```

5. Clique em "Review" e depois "Save policy"

### 1.4 Obter Credenciais Supabase
1. Vá em **Settings → API**
2. **COPIE E GUARDE** estes 3 valores:

```
NEXT_PUBLIC_SUPABASE_URL = [Project URL]
Exemplo: https://xxxxxxxxxxxxx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon public key]
Exemplo: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

DATABASE_URL = [Connection Pooling - Transaction mode]
Exemplo: postgresql://postgres.xxxxx:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

⚠️ **IMPORTANTE**: No `DATABASE_URL`, substitua `[YOUR-PASSWORD]` pela senha que criou no passo 1.1!

---

## 🤖 PASSO 2: Configurar Google Gemini AI (5 minutos)

### 2.1 Obter API Key
1. Acesse: https://aistudio.google.com/app/apikeys
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Selecione um projeto ou crie novo
5. **COPIE E GUARDE** a chave gerada:

```
GEMINI_API_KEY = AIzaSy...
```

---

## 🔐 PASSO 3: Gerar Secret para NextAuth (2 minutos)

### 3.1 Gerar Secret
Opção 1 - Terminal:
```bash
openssl rand -base64 32
```

Opção 2 - Online:
Acesse: https://generate-secret.vercel.app/32

**COPIE E GUARDE** o valor gerado:
```
NEXTAUTH_SECRET = [valor gerado]
```

---

## 🚀 PASSO 4: Deploy no Vercel (10 minutos)

### 4.1 Importar Projeto
1. Acesse: https://vercel.com/new
2. Faça login com GitHub
3. Clique em "Import Git Repository"
4. Procure por `gestor-naval-pro`
5. Clique em "Import"

### 4.2 Configurar Variáveis de Ambiente
Na seção "Environment Variables", adicione:

**Variable 1:**
- Name: `DATABASE_URL`
- Value: Cole o valor do Supabase (passo 1.4)
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Cole o valor do Supabase (passo 1.4)
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 3:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Cole o valor do Supabase (passo 1.4)
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 4:**
- Name: `GEMINI_API_KEY`
- Value: Cole o valor do Google (passo 2.1)
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 5:**
- Name: `NEXTAUTH_SECRET`
- Value: Cole o valor gerado (passo 3.1)
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 6:**
- Name: `NEXTAUTH_URL`
- Value: `https://gestor-naval-pro.vercel.app` (ou seu domínio)
- Environment: ✅ Production only

**Variable 7:**
- Name: `NODE_ENV`
- Value: `production`
- Environment: ✅ Production only

### 4.3 Fazer Deploy
1. Clique em "Deploy"
2. Aguarde ~3-5 minutos
3. ✅ Deploy completo!

---

## 🗄️ PASSO 5: Inicializar Base de Dados (5 minutos)

### 5.1 Instalar Vercel CLI (apenas uma vez)
```bash
npm install -g vercel
```

### 5.2 Login
```bash
vercel login
```

### 5.3 Baixar Variáveis de Ambiente
```bash
cd /caminho/para/gestor-naval-pro
vercel link
vercel env pull .env
```

### 5.4 Executar Seed
```bash
npm install
npm run db:seed
```

Você deve ver:
```
✅ Seeding concluído com sucesso!
📊 Dados criados:
   - 3 clientes
   - 3 navios
   - 10 jangadas
   - 12 tipos de packs
   - [número] itens de stock
```

---

## ✅ PASSO 6: Verificar (2 minutos)

### 6.1 Testar Aplicação
Acesse: `https://gestor-naval-pro.vercel.app`

### 6.2 Testar Endpoints
```bash
# Health check
curl https://gestor-naval-pro.vercel.app/api/health

# Deve retornar: {"status":"ok","timestamp":"..."}

# Listar marcas
curl https://gestor-naval-pro.vercel.app/api/marcas-jangada

# Deve retornar array com marcas: [{"id":"...","nome":"ZODIAC",...},...]

# Listar clientes
curl https://gestor-naval-pro.vercel.app/api/clientes

# Deve retornar array com clientes
```

### 6.3 Testar na UI
1. Abra a aplicação
2. Vá em "Clientes" → "Novo Cliente"
3. Preencha e salve ✅
4. Vá em "Jangadas" → "Nova Jangada"
5. Verifique que aparecem opções de Marca, Modelo, Lotação ✅
6. Preencha e salve ✅

---

## 🎉 Deployment Completo!

Se todos os testes passaram, sua aplicação está **ONLINE e FUNCIONANDO**!

---

## 🆘 Problemas?

### Erro: "Marcas não encontradas"
**Solução**: Execute `npm run db:seed` novamente

### Erro: "Database connection failed"
**Solução**: Verifique se o `DATABASE_URL` tem `?sslmode=require` no final e a senha está correta

### Erro: "Build failed"
**Solução**: Verifique se TODAS as variáveis foram adicionadas no Vercel

### Erro: Upload de arquivos falha
**Solução**: Verifique se o bucket `uploads` foi criado e é público

### Outros problemas?
Consulte: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📚 Documentação Completa

- **[VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md)** - Guia detalhado
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Resolução de problemas
- **[DEPLOYMENT-README.md](./DEPLOYMENT-README.md)** - Referência técnica
- **[DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md)** - Resumo executivo

---

## 💰 Custo

**TOTAL: €0/mês** (todos os serviços são gratuitos!)

- Vercel: Grátis (plano Hobby)
- Supabase: Grátis (500MB storage)
- Gemini AI: Grátis (1M tokens/mês)

---

**Status**: ✅ Pronto para Deploy  
**Tempo Estimado**: 40 minutos  
**Dificuldade**: Fácil (siga os passos)

Boa sorte! 🚀
