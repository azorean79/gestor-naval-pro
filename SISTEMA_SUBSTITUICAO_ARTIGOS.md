# 🔄 Sistema de Substituição de Artigos em Jangadas

## ✅ Implementado

### 1. **API Endpoint - Substituição de Artigos**
📍 **Localização**: `src/app/api/jangadas/substituir-artigo/route.ts`

**Funcionalidades**:
- `GET` - Busca artigos do stock disponíveis para substituição
- `POST` - Substitui um artigo na jangada com registro em auditoria

```typescript
// Request
POST /api/jangadas/substituir-artigo
{
  "jangadaId": 1,
  "referenciaAtual": "20500023",
  "novaReferencia": "30202207",
  "quantidade": 2
}

// Response
{
  "success": true,
  "artigo": {...},
  "mensagem": "Artigo substituído com sucesso"
}
```

---

### 2. **Componente React - Dialog de Substituição**
📍 **Localização**: `src/components/jangadas/SubstituirArtigoDialog.tsx`

**Features**:
- 🎯 Dialog modal com pré-visualização
- 📦 Seleção de artigos do stock disponível
- 🔢 Ajuste de quantidade
- ✅ Confirmação com feedback visual
- ❌ Validação de erros

```typescript
// Uso
<SubstituirArtigoDialog
  jangadaId={1}
  artigo={artigoAtual}
  onSuccess={() => recarregar()}
/>
```

---

### 3. **Componente React - Visualização de Artigos**
📍 **Localização**: `src/components/jangadas/JangadaArtigosView.tsx`

**Categorias**:
- 🆘 Artigos de Emergência (Paraquedas, Fachos, Potes)
- 🏥 Primeiros Socorros (First Aid Kit)
- 📦 Outros Artigos

**Funcionalidades**:
- Tabelas organizadas por categoria
- Botão "🔄 Substituir" em cada artigo
- Status visual com badges coloridas
- Recarga automática após substituição

```typescript
// Uso
<JangadaArtigosView jangadaId={1} />
```

---

### 4. **Artigos Vinculados - Status Atual**

#### ✅ Paraquedas (20500023)
- Referência: 20500023
- Adicionado em: 204/204 jangadas
- Quantidade padrão: 2 unidades

#### ✅ Fachos de Mão (20500035)
- Referência: 20500035
- Adicionado em: 204/204 jangadas
- Quantidade padrão: 3 unidades

#### ✅ Potes (20500002)
- Referência: 20500002
- Adicionado em: 204/204 jangadas
- Quantidade padrão: 2 unidades

#### ✅ First Aid Kit (30202207)
- Referência: 30202207
- Adicionado em: 204/204 jangadas
- Quantidade padrão: 1 unidade
- Nome: Farmacia Solas

---

### 5. **Base de Dados - Schema Prisma**

#### Novo Modelo: Auditoria
```prisma
model Auditoria {
  id              Int      @id @default(autoincrement())
  tabela          String   // Nome da tabela modificada
  tipoOperacao    String   // CREATE, UPDATE, DELETE
  idRegisto       Int      // ID do registo modificado
  descricao       String?  // Descrição da mudança
  usuario         String?  // Quem fez a alteração
  dadosAntes      String?  // JSON dos dados antes
  dadosDepois     String?  // JSON dos dados depois
  createdAt       DateTime @default(now())

  @@index([tabela])
  @@index([tipoOperacao])
  @@index([createdAt])
  @@index([usuario])
}
```

#### Artigos Existentes com Integração
- `ArtigoJangada` - Artigos associados a jangadas
- `Stock` - Artigos disponíveis no stock
- `Jangada` - Embarcações com artigos

---

## 🚀 Como Usar

### Exemplo na UI:

```typescript
// 1. Mostrar artigos da jangada
<JangadaArtigosView jangadaId={123} />

// 2. User clica em "🔄 Substituir" num artigo
// 3. Dialog abre mostrando opções do stock
// 4. User selecciona novo artigo e confirma
// 5. Sistema substitui e regista a auditoria
// 6. UI atualiza com nova informação
```

---

## 📊 Fluxo de Dados

```
Utilizador Click "Substituir"
    ↓
Dialog Abre (SubstituirArtigoDialog)
    ↓
Fetch Opções do Stock
    ↓
User Selecciona Novo Artigo
    ↓
POST /api/jangadas/substituir-artigo
    ↓
Prisma Atualiza ArtigoJangada
    ↓
Cria Registro em Auditoria
    ↓
JSON Response com Sucesso
    ↓
Dialog Fecha
    ↓
JangadaArtigosView Recarrega
    ↓
Tabela Atualiza com Novo Artigo
```

---

## 🔒 Segurança & Auditoria

Cada substituição é registada com:
- ✅ Antes: Dados originais (JSON)
- ✅ Depois: Dados novos (JSON)
- ✅ Tabela: ArtigoJangada
- ✅ Operação: UPDATE
- ✅ Utilizador: Sistema
- ✅ Timestamp: Data/hora exata

---

## 📝 Scripts Disponíveis

```bash
# Vincular Paraquedas, Fachos e Potes
npx tsx scripts/add_artigos_emergencia_jangadas.ts

# Vincular First Aid Kit
npx tsx scripts/vincular_first_aid_kit.ts

# Sincronizar artigos de emergência
npx tsx scripts/sync_artigos_emergencia.ts
```

---

## 🔜 Próximos Passos (TODO)

- [ ] Migração Prisma para adicionar tabela Auditoria
- [ ] Dashboard de histórico de substituições
- [ ] Relatórios de auditoria
- [ ] Notificações por email de mudanças

---

## 📦 Dependências

- `PrismaClient` - ORM
- `Next.js 16` - React/API
- `Dialog UI` - From Shadcn/ui
- `TypeScript` - Type safety

