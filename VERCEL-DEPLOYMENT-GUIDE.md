# 🚀 Guia Completo de Deployment no Vercel

## 📋 Pré-requisitos

Antes de fazer o deployment, certifique-se de ter:

1. ✅ Conta no Vercel (https://vercel.com)
2. ✅ Conta no Supabase (https://supabase.com) - GRÁTIS
3. ✅ API Key do Google Gemini (https://ai.google.dev/) - GRÁTIS
4. ✅ Base de dados PostgreSQL configurada

## 🔧 Passo 1: Configurar Supabase Storage

### 1.1 Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha os dados:
   - **Nome**: gestor-naval-pro (ou qualquer nome)
   - **Database Password**: Crie uma senha forte (guarde-a)
   - **Region**: Europe West (Ireland) - recomendado para Portugal
4. Clique em "Create new project" e aguarde ~2 minutos

### 1.2 Configurar Storage

1. No menu lateral, clique em **Storage**
2. Clique em "Create a new bucket"
3. Configure:
   - **Name**: `uploads`
   - **Public bucket**: ✅ SIM (marque a opção)
4. Clique em "Create bucket"

### 1.3 Configurar Políticas de Acesso

1. Clique no bucket `uploads`
2. Vá para a aba **Policies**
3. Clique em "New Policy" e crie as seguintes políticas:

**Política 1 - Permitir Upload Público:**
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');
```

**Política 2 - Permitir Leitura Pública:**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

**Política 3 - Permitir Atualização Pública:**
```sql
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'uploads');
```

**Política 4 - Permitir Exclusão Pública:**
```sql
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'uploads');
```

### 1.4 Obter Credenciais

1. Vá em **Settings → API**
2. Copie os valores:
   - **Project URL** → Esta é sua `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (API Keys) → Esta é sua `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **GUARDE ESTES VALORES** - você vai precisar deles!

### 1.5 Configurar Base de Dados PostgreSQL no Supabase

1. Vá em **Settings → Database**
2. Role até "Connection string"
3. Copie a **Connection Pooling** string (recomendado para Vercel)
4. Formato: `postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`
5. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 1.1
6. **GUARDE ESTE VALOR** - Esta é sua `DATABASE_URL`

## 🤖 Passo 2: Configurar Google Gemini AI

### 2.1 Obter API Key

1. Acesse https://aistudio.google.com/app/apikeys
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Selecione ou crie um projeto Google Cloud
5. Copie a chave gerada
6. **GUARDE ESTE VALOR** - Esta é sua `GEMINI_API_KEY`

### 2.2 Verificar Quotas Gratuitas

O plano gratuito do Gemini 1.5 Flash oferece:
- ✅ 15 requisições por minuto
- ✅ 1 milhão de tokens por mês
- ✅ Análise de documentos (PDF, Excel)
- ✅ SEM necessidade de cartão de crédito

## 🔐 Passo 3: Preparar Variáveis de Ambiente

### 3.1 Gerar NEXTAUTH_SECRET

No terminal, execute:
```bash
openssl rand -base64 32
```

Ou use um gerador online: https://generate-secret.vercel.app/32

**GUARDE ESTE VALOR** - Esta é sua `NEXTAUTH_SECRET`

### 3.2 Reunir Todas as Variáveis

Agora você deve ter os seguintes valores:

```env
# Database
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."

# NextAuth
NEXTAUTH_SECRET="sua-chave-gerada-aqui"
NEXTAUTH_URL="https://gestor-naval-pro.vercel.app"

# Environment
NODE_ENV="production"
```

## 📦 Passo 4: Deploy no Vercel

### 4.1 Conectar Repositório

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione o repositório `azorean79/gestor-naval-pro`
4. Se não aparecer, clique em "Adjust GitHub App Permissions" e autorize

### 4.2 Configurar o Projeto

1. **Framework Preset**: Next.js (deve detectar automaticamente)
2. **Root Directory**: ./
3. **Build Command**: `npm run build`
4. **Output Directory**: .next
5. **Install Command**: `npm install`
6. **Node Version**: 20.x

### 4.3 Adicionar Variáveis de Ambiente

1. Clique em "Environment Variables"
2. Adicione CADA variável:

**DATABASE_URL**
- Name: `DATABASE_URL`
- Value: Cole sua connection string do Supabase
- Environment: Production, Preview, Development ✅

**NEXT_PUBLIC_SUPABASE_URL**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Cole a URL do seu projeto Supabase
- Environment: Production, Preview, Development ✅

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Cole a anon key do Supabase
- Environment: Production, Preview, Development ✅

**GEMINI_API_KEY**
- Name: `GEMINI_API_KEY`
- Value: Cole sua API key do Gemini
- Environment: Production, Preview, Development ✅

**NEXTAUTH_SECRET**
- Name: `NEXTAUTH_SECRET`
- Value: Cole o secret gerado
- Environment: Production, Preview, Development ✅

**NEXTAUTH_URL**
- Name: `NEXTAUTH_URL`
- Value: `https://gestor-naval-pro.vercel.app` (ou seu domínio)
- Environment: Production ✅

**NODE_ENV**
- Name: `NODE_ENV`
- Value: `production`
- Environment: Production ✅

### 4.4 Fazer o Deploy

1. Clique em "Deploy"
2. Aguarde o build completar (~2-3 minutos)
3. Se houver erros, verifique os logs

## 🗄️ Passo 5: Inicializar a Base de Dados

### 5.1 Fazer Push do Schema Prisma

Após o primeiro deploy bem-sucedido:

1. No seu computador local, crie um arquivo `.env` com as variáveis
2. Execute:
```bash
npx prisma db push
```

Isto irá criar todas as tabelas na base de dados.

### 5.2 Seed da Base de Dados

Para popular a base de dados com dados iniciais:

```bash
npm run db:seed
```

Isto irá criar:
- 3 clientes de exemplo
- 3 navios de exemplo
- 10 jangadas de exemplo
- Marcas de jangadas (ZODIAC, VIKING, SURVITEC, etc.)
- Modelos de jangadas
- Lotações (4, 6, 8, 10, 12, 16, 20, 25, 30, 35, 40, 50 pessoas)
- Tipos de packs
- Itens de stock

### 5.3 (Opcional) Seed de Especificações Técnicas

Para adicionar especificações técnicas detalhadas:

```bash
npx tsx prisma/seed-especificacoes.ts
```

## ✅ Passo 6: Verificar o Deployment

### 6.1 Health Check

Acesse:
```
https://gestor-naval-pro.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T..."
}
```

### 6.2 Testar Endpoints Críticos

**Listar Clientes:**
```
GET https://gestor-naval-pro.vercel.app/api/clientes
```

**Listar Jangadas:**
```
GET https://gestor-naval-pro.vercel.app/api/jangadas
```

**Listar Marcas:**
```
GET https://gestor-naval-pro.vercel.app/api/marcas-jangada
```

**Listar Modelos:**
```
GET https://gestor-naval-pro.vercel.app/api/modelos-jangada
```

**Listar Lotações:**
```
GET https://gestor-naval-pro.vercel.app/api/lotacoes-jangada
```

### 6.3 Testar Aplicação

1. Acesse https://gestor-naval-pro.vercel.app
2. Faça login (se tiver autenticação configurada)
3. Teste criar:
   - ✅ Novo cliente
   - ✅ Nova jangada (deve mostrar marcas, modelos e lotações)
   - ✅ Upload de arquivo
   - ✅ Exportar relatório

## 🔧 Passo 7: Troubleshooting

### Erro: "Prisma Client not found"

**Solução:**
1. Vá em Vercel Dashboard → Settings → General
2. Em "Build & Development Settings"
3. Verifique se Build Command é: `npm run build`
4. Em package.json, o script build deve ter:
   ```json
   "build": "prisma generate && next build"
   ```

### Erro: "Database connection failed"

**Solução:**
1. Verifique se `DATABASE_URL` está correta
2. Certifique-se de que incluiu `?sslmode=require` no final
3. Teste a conexão localmente primeiro
4. Verifique se substituiu `[YOUR-PASSWORD]` pela senha real

### Erro: "Missing Supabase environment variables"

**Solução:**
1. Verifique se `NEXT_PUBLIC_SUPABASE_URL` começa com `https://`
2. Verifique se `NEXT_PUBLIC_SUPABASE_ANON_KEY` começa com `eyJ`
3. Confirme que marcou "Production, Preview, Development"
4. Faça um novo deploy após adicionar as variáveis

### Erro: "Marcas não encontradas" / "Clientes não encontrados"

**Solução:**
1. A base de dados não foi seeded
2. Execute localmente (com .env configurado):
   ```bash
   npm run db:seed
   ```
3. Ou use Vercel CLI:
   ```bash
   vercel env pull .env
   npm run db:seed
   ```

### Erro: Upload de arquivos falha

**Solução:**
1. Verifique se criou o bucket `uploads` no Supabase
2. Verifique se o bucket é público
3. Confirme que as políticas de acesso foram criadas
4. Teste upload manualmente no Supabase Dashboard

## 🎯 Passo 8: Otimizações Pós-Deploy

### 8.1 Configurar Domínio Personalizado

1. Em Vercel Dashboard → Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Atualize `NEXTAUTH_URL` com novo domínio

### 8.2 Configurar Cron Jobs

O arquivo `vercel-cron.json` já está configurado para:
- Lembretes automáticos a cada 8 horas

Para ativar:
1. Vercel detecta automaticamente
2. Ou vá em Settings → Cron Jobs
3. Ative os cron jobs configurados

### 8.3 Monitoramento

1. Vercel Dashboard → Analytics
2. Ative Web Analytics (grátis)
3. Monitore:
   - Tempo de resposta
   - Erros 500
   - Taxa de sucesso

### 8.4 Logs

Para ver logs em tempo real:
```bash
vercel logs gestor-naval-pro --follow
```

## 📊 Custos Estimados

- **Vercel**: €0 (plano Hobby - 100GB bandwidth)
- **Supabase**: €0 (plano Free - 500MB storage, 2GB bandwidth)
- **Gemini AI**: €0 (plano Free - 15 req/min, 1M tokens/mês)
- **Total**: €0/mês (sem custos!)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Vercel Dashboard
2. Consulte a documentação:
   - Vercel: https://vercel.com/docs
   - Supabase: https://supabase.com/docs
   - Next.js: https://nextjs.org/docs
3. Verifique issues no GitHub do projeto

## ✨ Próximos Passos

Após deployment bem-sucedido:

1. [ ] Configurar backup automático da base de dados
2. [ ] Configurar autenticação (NextAuth)
3. [ ] Adicionar usuários ao sistema
4. [ ] Importar dados reais de clientes/navios/jangadas
5. [ ] Configurar notificações por email
6. [ ] Personalizar branding da aplicação

---

**Última atualização**: 05/02/2026  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para produção
