# 🔧 Troubleshooting - Soluções Rápidas

## 🚨 Problema: "Marcas não encontradas"

### Causa
A base de dados não foi inicializada com os dados de marcas, modelos e lotações.

### Solução
1. **Localmente:**
```bash
# Configure .env com DATABASE_URL
npm run db:seed
```

2. **Na produção Vercel:**
```bash
# Pull das variáveis de ambiente
vercel env pull .env

# Execute seed
npm run db:seed
```

### Verificação
```bash
# Teste o endpoint
curl https://seu-dominio.vercel.app/api/marcas-jangada

# Deve retornar algo como:
# [{"id":"xxx","nome":"ZODIAC","ativo":true}, ...]
```

---

## 🚨 Problema: "Clientes não encontrados"

### Causa
A tabela de clientes está vazia.

### Solução
1. Execute o seed (como acima)
2. Ou crie manualmente via API:
```bash
curl -X POST https://seu-dominio.vercel.app/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Cliente Teste",
    "email": "teste@example.com",
    "telefone": "+351 123 456 789",
    "nif": "123456789",
    "delegacao": "Açores",
    "tecnico": "Julio Correia"
  }'
```

---

## 🚨 Problema: "Jangadas não encontradas"

### Causa
A tabela de jangadas está vazia ou não há marcas/modelos/lotações.

### Solução Completa
```bash
# 1. Seed dos dados base
npm run db:seed

# 2. (Opcional) Seed de especificações técnicas
npx tsx prisma/seed-especificacoes.ts
```

### Criar Jangada Via API
```bash
curl -X POST https://seu-dominio.vercel.app/api/jangadas \
  -H "Content-Type: application/json" \
  -d '{
    "numeroSerie": "TEST-001",
    "marcaId": "xxx",
    "modeloId": "yyy",
    "lotacaoId": "zzz",
    "tipo": "Balsa",
    "status": "ativo",
    "estado": "instalada",
    "clienteId": "cliente-id",
    "navioId": "navio-id"
  }'
```

---

## 🚨 Problema: Build falha no Vercel

### Erro: "Prisma Client not found"

**Solução:**
Verifique `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### Erro: "DATABASE_URL not found"

**Solução:**
1. Vá em Vercel Dashboard → Settings → Environment Variables
2. Adicione `DATABASE_URL` com sua connection string
3. Marque: Production, Preview, Development
4. Redeploy

---

## 🚨 Problema: "Failed to connect to database"

### Solução 1: Verificar Connection String
```bash
# Formato correto:
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Certifique-se de que:
# - Substitui [YOUR-PASSWORD] pela senha real
# - Inclui ?sslmode=require no final
# - Usa porta 6543 para connection pooling do Supabase
```

### Solução 2: Testar Conexão
```bash
# Instale psql
brew install postgresql # macOS
sudo apt install postgresql-client # Linux

# Teste conexão
psql "postgresql://user:password@host:5432/database?sslmode=require"
```

---

## 🚨 Problema: Upload de arquivos falha (500)

### Causa
Supabase Storage não configurado corretamente.

### Solução Passo a Passo

1. **Verificar variáveis de ambiente:**
```bash
# No Vercel, confirme que existem:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

2. **Criar bucket no Supabase:**
   - Dashboard → Storage → Create bucket
   - Nome: `uploads`
   - Público: SIM

3. **Adicionar políticas:**
```sql
-- No Supabase SQL Editor
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

---

## 🚨 Problema: Gemini AI não funciona

### Erro: "GEMINI_API_KEY not configured"

**Solução:**
1. Obtenha chave em: https://aistudio.google.com/app/apikeys
2. Adicione em Vercel:
   - Name: `GEMINI_API_KEY`
   - Value: Sua chave (começa com `AIzaSy...`)
   - Environment: Production, Preview, Development
3. Redeploy

### Erro: "Quota exceeded"

**Solução:**
- Plano grátis: 15 requests/minuto
- Espere 1 minuto e tente novamente
- Ou upgrade para plano pago

---

## 🚨 Problema: Erros 500 aleatórios

### Investigação
```bash
# Ver logs em tempo real
vercel logs gestor-naval-pro --follow

# Logs de uma função específica
vercel logs gestor-naval-pro --function=api/jangadas

# Últimos 100 logs
vercel logs gestor-naval-pro -n 100
```

### Verificar Health
```bash
curl https://seu-dominio.vercel.app/api/health

# Deve retornar:
# {"status":"ok","timestamp":"2026-02-05T..."}
```

---

## 🚨 Problema: Timeout em requisições

### Causa
Função excede 10s (limite do plano Hobby).

### Solução
Verifique `vercel.json`:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Nota:** maxDuration > 10s requer plano Pro.

---

## 🚨 Problema: CORS errors

### Solução
Adicione headers CORS nas rotas API:

```typescript
// Em route.ts
export async function GET() {
  const data = await fetchData();
  
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

---

## 🚨 Problema: Dados não aparecem após seed

### Verificação
```bash
# Conecte ao banco
psql $DATABASE_URL

# Verifique dados
SELECT COUNT(*) FROM marcas_jangada;
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM jangadas;
SELECT COUNT(*) FROM stock;

# Saia
\q
```

### Se tabelas estão vazias
```bash
# Re-run seed
npm run db:seed

# Ou force reset (CUIDADO: apaga tudo!)
npx prisma db push --force-reset
npm run db:seed
```

---

## 🚨 Problema: Prisma schema desatualizado

### Solução
```bash
# Gerar cliente Prisma
npx prisma generate

# Push schema para DB
npx prisma db push

# Ou criar migration
npx prisma migrate dev --name nome-da-migration
```

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy, verifique:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build passa localmente (se possível)
- [ ] Seed executado com sucesso
- [ ] Supabase bucket criado e público
- [ ] Gemini API key válida
- [ ] Database schema up-to-date
- [ ] .env.example atualizado
- [ ] Documentação revisada

---

## 📞 Suporte Adicional

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs

---

**Última atualização**: 05/02/2026  
**Versão**: 1.0.0
