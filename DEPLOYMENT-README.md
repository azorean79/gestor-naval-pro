# 🚀 Deployment Ready - Gestor Naval Pro

## Status do Projeto

✅ **PRONTO PARA DEPLOYMENT NO VERCEL**

Este projeto está configurado e pronto para ser deployed no Vercel com todas as dependências gratuitas:
- ✅ Supabase Storage (grátis)
- ✅ Google Gemini AI (grátis)
- ✅ PostgreSQL via Supabase (grátis até 500MB)
- ✅ Vercel Hosting (grátis - plano Hobby)

---

## 🎯 Início Rápido

### 1. Configure as Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```bash
cp .env.example .env.local
```

Você precisará de:
- **DATABASE_URL**: Connection string do PostgreSQL (obtenha do Supabase)
- **NEXT_PUBLIC_SUPABASE_URL**: URL do projeto Supabase
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Chave pública do Supabase
- **GEMINI_API_KEY**: Chave da API do Google Gemini
- **NEXTAUTH_SECRET**: Gere com `openssl rand -base64 32`

### 2. Instale Dependências

```bash
npm install
```

### 3. Configure o Banco de Dados

```bash
# Criar tabelas
npx prisma db push

# Popular com dados iniciais
npm run db:seed
```

### 4. Rode Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 📚 Documentação

### Guias Principais

1. **[VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md)**  
   Guia completo passo a passo para fazer deployment no Vercel

2. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**  
   Soluções para problemas comuns

3. **[VARIAVEIS-AMBIENTE.md](./VARIAVEIS-AMBIENTE.md)**  
   Documentação detalhada de todas as variáveis de ambiente

### Guias de Configuração

- **[DEPLOY-VERCEL-CHECKLIST.md](./DEPLOY-VERCEL-CHECKLIST.md)** - Checklist de deployment
- **[GUIA-CHAVES-GEMINI-SUPABASE.md](./GUIA-CHAVES-GEMINI-SUPABASE.md)** - Como obter chaves

---

## 🔑 Variáveis de Ambiente Necessárias

### Obrigatórias

```env
# Database
DATABASE_URL="postgresql://..."

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# AI
GEMINI_API_KEY="AIzaSy..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://seu-dominio.vercel.app"
```

### Opcionais

```env
NODE_ENV="production"
GOOGLE_AI_API_KEY="..."
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **clientes** - Clientes/Armadores
- **navios** - Navios/Embarcações
- **jangadas** - Jangadas salva-vidas
- **marcas_jangada** - Marcas (ZODIAC, VIKING, etc.)
- **modelos_jangada** - Modelos de jangadas
- **lotacoes_jangada** - Capacidades (4, 6, 8, 10, 12, etc.)
- **stock** - Inventário de peças e componentes
- **certificados** - Certificados e documentação
- **inspecoes** - Inspeções técnicas

### Seed Inicial

O comando `npm run db:seed` cria:
- ✅ 3 clientes de exemplo
- ✅ 3 navios de exemplo
- ✅ 10 jangadas de exemplo
- ✅ 8 marcas (ZODIAC, VIKING, SURVITEC, RFD, SWITLIK, ARIMAR, EUROVINIL, PLASTIMO)
- ✅ Modelos para cada marca
- ✅ 12 opções de lotação (4-50 pessoas)
- ✅ 12 tipos de packs
- ✅ 100+ itens de stock

---

## 🚀 Deploy no Vercel

### Método 1: Via Dashboard (Recomendado)

1. Acesse https://vercel.com/new
2. Importe o repositório `azorean79/gestor-naval-pro`
3. Configure as variáveis de ambiente (ver `.env.example`)
4. Clique em "Deploy"

### Método 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Pós-Deploy

1. **Inicializar banco de dados:**
```bash
vercel env pull .env
npm run db:seed
```

2. **Verificar deployment:**
```bash
curl https://seu-dominio.vercel.app/api/health
```

3. **Testar endpoints:**
   - `/api/clientes` - Listar clientes
   - `/api/jangadas` - Listar jangadas
   - `/api/marcas-jangada` - Listar marcas
   - `/api/stock` - Listar stock

---

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Build de produção
npm run start            # Inicia servidor de produção

# Database
npm run db:seed          # Popular banco com dados iniciais
npm run db:migrate       # Criar/atualizar schema
npm run db:studio        # Abrir Prisma Studio

# Outros
npm run lint             # Verificar código
```

---

## 🔧 Resolução de Problemas

### "Marcas não encontradas"

Execute o seed:
```bash
npm run db:seed
```

### "Database connection error"

Verifique se `DATABASE_URL` está correta e inclui `?sslmode=require`

### "Build failed"

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique logs no Vercel Dashboard
3. Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Upload de arquivos falha

1. Verifique se bucket `uploads` foi criado no Supabase
2. Verifique se bucket é público
3. Verifique políticas de acesso

---

## 📊 Tecnologias Utilizadas

- **Framework**: Next.js 16.1.6 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Supabase Storage
- **AI**: Google Gemini 1.5 Flash
- **UI**: Tailwind CSS + Radix UI
- **Hosting**: Vercel

---

## 🎯 Features Principais

### Gestão de Jangadas
- ✅ CRUD completo de jangadas
- ✅ Inspeções técnicas (SOLAS, IMO)
- ✅ Importação de quadros de inspeção (Excel)
- ✅ Gestão de componentes e cilindros
- ✅ Certificados e validades

### Gestão de Navios
- ✅ CRUD de navios
- ✅ Associação com clientes
- ✅ Histórico de inspeções

### Gestão de Stock
- ✅ Inventário de peças e componentes
- ✅ Movimentações de entrada/saída
- ✅ Códigos de barras
- ✅ Alertas de stock mínimo

### Análise IA
- ✅ Análise de documentos PDF/Excel
- ✅ Extração automática de dados
- ✅ Assistente virtual (Julinho)
- ✅ Import inteligente de quadros

### Relatórios
- ✅ Exportação para Excel
- ✅ Geração de QR codes
- ✅ Etiquetas de jangadas
- ✅ Quadros de inspeção

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verifique documentação:
   - [Vercel Docs](https://vercel.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Prisma Docs](https://prisma.io/docs)
3. Abra uma issue no GitHub

---

## ✅ Checklist de Deployment

Antes de fazer deploy, verifique:

- [ ] `.env.local` configurado com todas as variáveis
- [ ] Supabase projeto criado
- [ ] Bucket `uploads` criado e público
- [ ] Gemini API key obtida
- [ ] Database schema aplicado (`prisma db push`)
- [ ] Seed executado (`npm run db:seed`)
- [ ] Build passa localmente (se possível)
- [ ] Todas as variáveis adicionadas no Vercel

---

## 📄 Licença

Este projeto é privado e de uso interno.

---

**Última atualização**: 05/02/2026  
**Versão**: 1.0.0  
**Status**: ✅ Production Ready
