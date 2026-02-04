# 🔑 Guia Completo - Obter Chaves (Gemini + Supabase)

## 1️⃣ GOOGLE GEMINI API KEY (100% GRATUITO)

### Passo 1: Aceder ao Google AI Studio
1. Abra: https://ai.google.dev/
2. Clique **"Get API Key"** (canto superior direito)

### Passo 2: Criar Projeto Google Cloud
1. Clique **"Get API Key"** novamente
2. Aparece popup: **"Create API key in new Google Cloud project"**
3. Clique **"Create API Key in Google Cloud Project"**

### Passo 3: Confirmar Termos
1. Leia os termos (2 checkboxes)
2. ✅ Marque ambos os checkboxes
3. Clique **"Create API Key"**

### Passo 4: Copiar a Chave
```
🔑 Sua chave aparece no ecrã:
   AIza...XXXXXXXXXXXXX

Clique para copiar (ícone clipboard) ou selecione manualmente
```

### Passo 5: Guardar Seguro
```bash
# Em .env.local (LOCAL):
GEMINI_API_KEY=AIza...XXXXXXXXXXXXX

# NO VERCEL DASHBOARD (PRODUÇÃO):
Settings → Environment Variables → Add
Name: GEMINI_API_KEY
Value: AIza...XXXXXXXXXXXXX (colar aqui)
```

### ✅ Verificação
```bash
# Confirme que funciona localmente:
npm run dev
# Teste: http://localhost:3000/assistente-demo
# Clique em Julinho e converse
```

---

## 2️⃣ SUPABASE (STORAGE + DATABASE)

### Passo 1: Criar Conta Supabase
1. Abra: https://supabase.com/dashboard
2. Clique **"Sign Up"** (canto superior direito)
3. Escolha: **"Continuar com Google"** (mais rápido)
4. Autorize acesso

### Passo 2: Criar Organização
1. Nome: Seu nome ou empresa
2. Clique **"Create organization"**

### Passo 3: Criar Projeto
1. Clique **"New project"**
2. Preencha:
   ```
   Project name: gestor-naval-pro
   Database password: Criar senha segura (copia!)
   Region: Escolha região mais próxima (ex: Europe - Ireland)
   ```
3. Clique **"Create new project"**
4. **AGUARDE 2-3 MINUTOS** (inicializa database)

### Passo 4: Copiar URLs e Chaves
Após inicializar, vá a: **Settings → API**

Copie **3 valores importantes**:

```
1️⃣ URL DO PROJETO:
   https://xxxxxxxxxxx.supabase.co
   → Copiar para: NEXT_PUBLIC_SUPABASE_URL

2️⃣ ANON PUBLIC KEY:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   → Copiar para: NEXT_PUBLIC_SUPABASE_ANON_KEY

3️⃣ SERVICE ROLE SECRET:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (diferente)
   → Guardar de lado (pode precisar depois)
```

### Passo 5: Criar Bucket de Storage
1. No menu esquerdo: **Storage** (ao lado de SQL Editor)
2. Clique **"Create a new bucket"**
3. Preencha:
   ```
   Bucket name: uploads
   Public bucket: ✅ SIM (permitir download público)
   ```
4. Clique **"Create bucket"**

### Passo 6: Configurar Políticas de Acesso
1. No bucket "uploads", clique **"Policies"** (aba superior)
2. Se não existem, clique **"Create policy"**
3. Use template: **"Allow public read-write access"**

Ou execute manualmente em **SQL Editor**:
```sql
-- Permitir upload anónimo
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT TO public 
WITH CHECK (bucket_id = 'uploads');

-- Permitir download público
CREATE POLICY "Allow public read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');
```

### Passo 7: Guardar no .env.local
```bash
# LOCAL (.env.local):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3️⃣ ADICIONAR AO VERCEL (PRODUÇÃO)

### Passo 1: Abrir Dashboard Vercel
1. Vá a: https://vercel.com/julio-correas-projects/gestor-naval-pro
2. Clique **"Settings"** (menu superior)
3. Clique **"Environment Variables"** (menu esquerdo)

### Passo 2: Adicionar 3 Variáveis

**Variável 1: GEMINI**
```
Name: GEMINI_API_KEY
Value: AIza...XXXXXXXXXXXXX
Production: ✅
Preview: ✅
Development: ☐
```
Clique **"Save"**

**Variável 2: SUPABASE URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxx.supabase.co
Production: ✅
Preview: ✅
Development: ☐
```
Clique **"Save"**

**Variável 3: SUPABASE KEY**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Production: ✅
Preview: ✅
Development: ☐
```
Clique **"Save"**

### Passo 3: Redeploy
1. Volte à página principal do projeto
2. Clique **"Deployments"**
3. Clique nos **3 pontos** do deployment mais recente
4. Clique **"Redeploy"**
5. Confirme **"Redeploy without cache"**

**AGUARDE 2-3 MINUTOS**

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### Local (antes de testar)
```
☐ GEMINI_API_KEY adicionada ao .env.local
☐ NEXT_PUBLIC_SUPABASE_URL adicionada ao .env.local
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY adicionada ao .env.local
☐ npm run dev inicia sem erros
☐ Servidor executa em http://localhost:3000
```

### Supabase Cloud
```
☐ Projeto criado e inicializado
☐ Bucket "uploads" criado
☐ Políticas de storage configuradas
☐ 3 valores copiados com sucesso
```

### Vercel Produção
```
☐ GEMINI_API_KEY adicionada
☐ NEXT_PUBLIC_SUPABASE_URL adicionada
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY adicionada
☐ Redeploy completado
☐ App abre em https://gestor-naval-pro.vercel.app
```

---

## 🧪 TESTE RÁPIDO APÓS CONFIGURAR

### Local
```bash
cd "c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro"
npm run dev
# Abrir http://localhost:3000/assistente-demo
# Clicar em Julinho
# Digitar: "Olá"
# Deve responder com IA Gemini ✅
```

### Produção
```bash
# Após redeploy completar
# Abrir https://gestor-naval-pro.vercel.app/assistente-demo
# Clicar em Julinho
# Digitar: "Olá"
# Deve responder com IA Gemini ✅
```

---

## 🐛 TROUBLESHOOTING

### "Cannot find GEMINI_API_KEY"
✅ Solução:
1. Confirmar que está em `.env.local`
2. Reiniciar servidor: `npm run dev`
3. Aguardar 5 segundos

### "Supabase connection refused"
✅ Solução:
1. Confirmar URL correta (sem "/" no final)
2. Confirmar ANON_KEY válida
3. Testar bucket: https://xxxxxxxxxxx.supabase.co/storage/v1/object/public/uploads/

### Upload não funciona em Produção
✅ Solução:
1. Confirmar que redeploy completou
2. Verificar se bucket tem políticas public
3. Testar em http://localhost:3000 primeiro

### Julinho não responde
✅ Solução:
1. Abrir console do navegador (F12)
2. Verificar errors em Network tab
3. Confirmar GEMINI_API_KEY válida no Vercel

---

## 📚 REFERÊNCIAS

- [Google Gemini Docs](https://ai.google.dev/docs)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase API Reference](https://supabase.com/docs/reference)
- Converter em http://localhost:3000 primeiro para debug

---

**Depois de terminar este guia:**
1. ✅ Confirme todos os valores copiados
2. ✅ Teste localmente: `npm run dev`
3. ✅ Teste em produção após redeploy
4. ✅ Avise-me quando tudo estiver pronto para os testes! 🚀
