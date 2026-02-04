# Configuração de Variáveis de Ambiente - ATUALIZADO

## ⚠️ IMPORTANTE - Nova Configuração

O sistema foi migrado para utilizar serviços **100% GRATUITOS**:
- ✅ **Supabase Storage** (substituiu upload para filesystem)
- ✅ **Google Gemini AI** (substituiu OpenAI)
- ✅ **Suporte a múltiplos ficheiros** simultâneos

## Variáveis de Ambiente Necessárias

### 1. Database (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### 2. Supabase Storage (NOVO - OBRIGATÓRIO)
```env
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anonima-aqui"
```

**Como obter:**
1. Aceda a https://supabase.com/dashboard
2. Crie um projeto gratuito (ou use existente)
3. Vá em Settings → API
4. Copie "Project URL" para `NEXT_PUBLIC_SUPABASE_URL`
5. Copie "anon public" key para `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Configurar Storage:**
1. No Supabase Dashboard → Storage
2. Crie um bucket chamado `uploads`
3. Configure como público (ou privado conforme necessidade)
4. Adicione policies de acesso:
   ```sql
   -- Allow public uploads
   CREATE POLICY "Allow public uploads" ON storage.objects
   FOR INSERT TO public
   WITH CHECK (bucket_id = 'uploads');
   
   -- Allow public reads
   CREATE POLICY "Allow public reads" ON storage.objects
   FOR SELECT TO public
   USING (bucket_id = 'uploads');
   ```

### 3. Google Gemini AI (NOVO - OBRIGATÓRIO)
```env
GEMINI_API_KEY="sua-chave-gemini-aqui"
```

**Como obter (GRÁTIS):**
1. Aceda a https://ai.google.dev/
2. Clique em "Get API Key"
3. Crie/selecione um projeto Google Cloud
4. Copie a API Key gerada

**Plano Gratuito Gemini 1.5 Flash:**
- ✅ 15 requests/minuto
- ✅ 1 milhão de tokens/mês
- ✅ Análise de documentos PDF/Excel
- ✅ Sem necessidade de cartão de crédito

### 4. NextAuth (Autenticação)
```env
NEXTAUTH_SECRET="gere-uma-string-aleatoria-segura"
NEXTAUTH_URL="https://seu-dominio.vercel.app"
```

## Variáveis REMOVIDAS

❌ **OPENAI_API_KEY** - Não é mais necessária (quota excedida, foi substituída)

## Configuração no Vercel

1. Aceda ao projeto no Vercel Dashboard
2. Settings → Environment Variables
3. Adicione cada variável:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://seu-projeto.supabase.co`
   - Environment: Production, Preview, Development

4. Repita para todas as variáveis necessárias

5. **Redeploy** para aplicar as mudanças:
   ```bash
   vercel --prod
   ```

## Funcionalidades Atualizadas

### Upload de Imagens
- ✅ Agora usa Supabase Storage (compatível com Vercel)
- ✅ Suporta múltiplos ficheiros simultâneos
- ✅ Retorna URLs públicas do Supabase
- ✅ Sem limite de tamanho do Vercel (até 5MB por ficheiro)

**Endpoint:** `POST /api/upload`
```javascript
// Upload único
formData.append('file', imageFile);

// Upload múltiplo
formData.append('file0', imageFile1);
formData.append('file1', imageFile2);
formData.append('file2', imageFile3);
```

### Análise de Documentos IA
- ✅ Agora usa Google Gemini (gratuito, sem quota)
- ✅ Suporta múltiplos ficheiros simultâneos
- ✅ Análise de PDF, Excel, CSV
- ✅ Extração automática de dados

**Endpoint:** `POST /api/documents/analyze`
```javascript
// Análise única
formData.append('file', pdfFile);

// Análise múltipla
formData.append('file0', pdf1);
formData.append('file1', excel1);
formData.append('file2', csv1);
```

### Import de Quadro de Inspeção
- ✅ Agora usa Google Gemini
- ✅ Suporta múltiplos quadros simultâneos
- ✅ Extração automática de componentes, testes, cilindros

**Endpoint:** `POST /api/jangadas/import-quadro`
```javascript
// Import múltiplo
formData.append('file0', quadro1.xlsx);
formData.append('file1', quadro2.xlsx);
formData.append('file2', quadro3.xlsx);
```

## Verificação

Teste as variáveis:
```bash
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
node -e "console.log(process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY configurada' : 'FALTA GEMINI_API_KEY')"
```

## Troubleshooting

### Erro: "GEMINI_API_KEY não configurado"
- Verifique se adicionou a variável no Vercel
- Redeploy após adicionar
- Nome correto: `GEMINI_API_KEY`

### Erro: "Missing Supabase environment variables"
- Verifique `NEXT_PUBLIC_SUPABASE_URL`
- Verifique `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Devem começar com `NEXT_PUBLIC_` para serem acessíveis no cliente

### Upload retorna 500
- Verifique se criou o bucket `uploads` no Supabase
- Verifique se o bucket tem policies de acesso
- Confirme que as chaves Supabase estão corretas

### Análise IA retorna erro
- Verifique quota do Gemini (1M tokens/mês)
- Confirme que GEMINI_API_KEY está ativa
- Teste com ficheiro menor primeiro

## Custo Mensal Estimado

- **Supabase:** €0 (plano gratuito - 500MB storage, 2GB bandwidth)
- **Gemini AI:** €0 (plano gratuito - 15 req/min, 1M tokens/mês)
- **Vercel:** €0 (plano gratuito - 100GB bandwidth)
- **PostgreSQL:** Variável (depende do provider)

**TOTAL: €0-20/mês** (dependendo apenas da base de dados)

## Migração Completa

### Antes (Pago):
- ❌ OpenAI GPT-4 (~$20/mês)
- ❌ Filesystem upload (incompatível Vercel)
- ❌ Upload único de ficheiros

### Depois (Gratuito):
- ✅ Google Gemini Flash (€0)
- ✅ Supabase Storage (€0)
- ✅ Upload múltiplo simultâneo
- ✅ Mais rápido e escalável

---

**Última atualização:** 2026-02-04
**Versão:** 2.0.0 - Migração para serviços gratuitos
