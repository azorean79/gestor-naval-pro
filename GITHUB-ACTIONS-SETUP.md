# 🚀 Configuração GitHub Actions + Vercel

## ✅ Passos de Configuração

### 1. **Gerar Tokens**

#### Vercel Token
1. Acesse https://vercel.com/account/tokens
2. Clique em "Create Token"
3. Nome: `VERCEL_TOKEN_GITHUB_ACTIONS`
4. Copie o token gerado
5. No repositório GitHub → Settings → Secrets → New repository secret
   - Nome: `VERCEL_TOKEN`
   - Valor: [Cole o token do Vercel]

#### Vercel Project IDs
1. Na dashboard Vercel, clique no projeto **gestor-naval-pro**
2. Vá em Settings → General
3. Copie:
   - **ORG ID**: ID da organização/conta
   - **PROJECT ID**: ID específico do projeto
4. No repositório GitHub → Settings → Secrets → New repository secret
   - Nome: `VERCEL_ORG_ID`
   - Valor: [Cole o ORG ID]
5. Crie outro secret:
   - Nome: `VERCEL_PROJECT_ID`
   - Valor: [Cole o PROJECT ID]

### 2. **Configurar Variáveis de Ambiente no Vercel**

As variáveis do seu `.env.local` devem estar configuradas no Vercel:

1. https://vercel.com/gestor-naval-pro/settings/environment-variables
2. Adicione todas as variáveis necessárias:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NEXT_PUBLIC_*` (variáveis públicas)
   - etc.

### 3. **Verificar Configuração**

Após configurar, faça um push para testar:

```bash
git add .
git commit -m "chore: setup GitHub Actions deployment"
git push origin main
```

Vá em GitHub → Actions para ver o workflow em ação!

## 📊 O que o Workflow Faz

### Build & Test
- ✅ Verifica código em Node 18 e 20
- ✅ Instala dependências
- ✅ Roda linter (ESLint)
- ✅ Build do projeto
- ✅ Testes (se houver)

### Deploy (apenas na branch main)
- ✅ Usa Vercel CLI
- ✅ Puxa variáveis de ambiente
- ✅ Faz build para produção
- ✅ Deploy automático para Vercel

### Notificação
- ✅ Informa status do deployment

## 🔄 Workflow de Git

```
seu código local
    ↓
git push origin main
    ↓
GitHub Actions roda
    ↓
Build & testes passam? 
    ↓ Sim
Deploy para Vercel
    ↓
Site atualizado em produção
```

## 🚨 Troubleshooting

### Deploy falha por variáveis faltando
→ Adicione as variáveis no Vercel Settings → Environment Variables

### Build falha no GitHub mas funciona local
→ Verifique `.env.local` não está no Git (deve estar em `.gitignore`)
→ Variáveis públicas devem ter prefixo `NEXT_PUBLIC_`

### Quer desabilitar auto-deploy
→ Remova a branch condition em `.github/workflows/deploy.yml` linha 39

---

**Status:** ✅ GitHub Actions configurado!  
**Próximo passo:** Configure os secrets acima e teste um push.
