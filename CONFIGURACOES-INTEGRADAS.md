# 🎯 Configurações Técnicas Integradas

## Visão Geral

A página **`http://localhost:3000/configuracoes`** integra **Marcas**, **Modelos** e **Especificações Técnicas** numa interface unificada.

## 🎨 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  CONFIGURAÇÕES TÉCNICAS                                         │
│  Gestão integrada de marcas, modelos e especificações técnicas  │
└─────────────────────────────────────────────────────────────────┘

              ESTATÍSTICAS
┌──────────┬──────────┬──────────┬──────────┐
│ Marcas:2 │ Modelos:2│ Specs:16 │ Seleçãõ:8│
└──────────┴──────────┴──────────┴──────────┘

┌──────────────────┬──────────────────┬──────────────────┐
│    MARCAS        │    MODELOS       │ ESPECIFICAÇÕES   │
├──────────────────┼──────────────────┼──────────────────┤
│                  │                  │                  │
│🔍 Procurar...    │🔍 Procurar...    │🔍 Procurar...    │
│                  │                  │                  │
│✓ RFD SURVIVA [8] │✓ SURVIVA MKIV[8] │✓ SURVIVA MKIV[4p]│
│  MKIV            │  (1º modelo)    │✓ SURVIVA MKIV[6p]│
│○ DSB LR07     [8]│                  │✓ SURVIVA MKIV[8p]│
│                  │                  │... (mais)        │
│                  │                  │                  │
│                  │                  │[Ver Detalhes]    │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NAVEGAÇÃO RÁPIDA                                        │
├──────┬────────┬──────────────┬────────┬────────┐
│Marcas│Modelos │Especificações│Inspeçõ │Jangadas│
└──────┴────────┴──────────────┴────────┴────────┘
```

## ✨ Funcionalidades

### Painel 1 - Marcas
- 🔍 **Pesquisa**: Filtre marcas por nome
- 📊 **Contador**: Quantidade de modelos de cada marca
- ✓ **Seleção**: Clique para selecionar uma marca (destaque azul)
- 🔗 **Integração**: Ao selecionar, filtra modelos e especificações

### Painel 2 - Modelos
- 📋 **Listagem Dinâmica**: Mostra apenas modelos da marca selecionada
- 🔍 **Pesquisa**: Filtre modelos por nome
- 📊 **Contador**: Quantidade de especificações por modelo
- 🎯 **Seleção**: Clique para selecionar um modelo (destaque roxo)
- 🔗 **Integração**: Filtra ainda mais as especificações

### Painel 3 - Especificações
- 📋 **Listagem Contextual**: Mostra especificações da marca e/ou modelo selecionados
- 🔍 **Busca**: Filtre por capacidade (ex: "8p")
- 🔗 **Acesso Direto**: Clique para ver detalhes completos da especificação
- 📈 **Badges**: Visualize capacidade de cada configuração

## 🚀 Como Usar

### 1️⃣ Fluxo Básico: Marca → Modelos → Especificações
```
1. Painel Marcas: Clique numa marca (ex: RFD SURVIVA MKIV)
   ↓ Painel de modelos é preenchido
2. Painel Modelos: Clique num modelo (opcional)
   ↓ Painel de especificações é filtrado
3. Painel Especificações: Clique numa especificação para ver detalhes
```

### 2️⃣ Pesquisa em Tempo Real
```
Marca selecionada: RFD SURVIVA MKIV
├─ Painel Modelos: tipos "MKIV" e vê SURVIVA MKIV
├─ Painel Especificações: escreve "8p" e vê apenas 8 pessoas
└─ Clica e abre `/especificacoes/[id]` com todos os dados
```

### 3️⃣ Ver Detalhes Completos
```
Clique numa especificação no painel direito
↓
Abre: /especificacoes/[id] com:
  • Cilindros de gás (CO₂/N₂)
  • Contentores com dimensões
  • Cintas de fecho
  • Manual de serviço
  • Interligações e.diagramas
  • Testes de verificação
  • Checklist de inspeção
```

## 📊 Dados Integrados

### Estrutura
```
Marcas (2)
├─ RFD
│  └─ Modelos (1)
│     └─ SURVIVA MKIV
│        └─ Especificações (8)
│           ├─ 4p, 6p, 8p, 10p
│           └─ 12p, 16p, 20p, 25p
│
└─ DSB
   └─ Modelos (1)
      └─ LR07
         └─ Especificações (8)
            ├─ 4p, 6p, 8p, 10p
            └─ 12p, 16p, 20p, 25p
```

### Totais
- **2 Marcas**
- **2 Modelos**
- **16 Especificações Técnicas**

## 🔗 Links de Navegação

| Página | URL | Descrição |
|--------|-----|-----------|
| Configurações | `/configuracoes` | **NOVO**: Vista integrada (3 painéis) |
| Marcas | `/marcas` | Gestão de marcas com link para Configurações |
| Modelos | `/modelos` | Gestão de modelos com link para Configurações |
| Especificações | `/especificacoes` | Lista de especificações com filtros |
| Detalhes Spec | `/especificacoes/[id]` | Detalhes completos com 5 tabs |
| Inspeções | `/inspecoes` | Inspeções de jangadas |
| Jangadas | `/jangadas` | Gestão de jangadas |

## 💡 Dicas de Uso

### Navegação em Desktop
- Os 3 painéis aparecem lado a lado (3 colunas)
- Altura máxima: 500px com scroll interno
- Ideal para seleção rápida

### Navegação em Mobile
- Os painéis empilham-se (1 coluna)
- Mantém funcionalidade completa
- Scroll vertical natural

### Performance
- Carregamento paralelo (Marca + Modelo + Especificações)
- Caching com React Query
- Sem requisições desnecessárias

### Integração Contextual
- Ao selecionar Marca: Modelos filtram automaticamente
- Ao selecionar Modelo: Especificações refinam mais
- Pode cancelar seleção clicando novamente

## 🛠️ Manutenção

### Adicionar Nova Marca
1. `/marcas` → "Nova Marca"
2. Aparece automaticamente em Configurações

### Adicionar Novo Modelo
1. `/modelos` → "Novo Modelo"
2. Aparece automaticamente em Configurações

### Adicionar Especificação
1. Crie jangada com marca/modelo
2. Adicione dados técnicos
3. Sincroniza automaticamente

## 📞 Resolução de Problemas

| Problema | Solução |
|----------|---------|
| Marca não aparece | Verifique status "ativo" em `/marcas` |
| Modelo não aparece | Verifique marca associada e status "ativo" |
| Especificação não carrega | Atualize a página (F5) |
| 3 painéis não ficam lado a lado | Use tela com largura ≥1280px (lg breakpoint) |

## 🎓 Exemplos de Fluxo

### Exemplo 1: Procurar Especificação de RFD 8p
```
1. Marca: Clique em "RFD SURVIVA MKIV"
2. Modelos: Vê "SURVIVA MKIV" (1 modelo)
3. Especificações: Procura "8p"
4. Click em "8p" → Abre detalhes completos
```

### Exemplo 2: Comparar Modelos de Mesma Marca
```
1. Marca: Clique em "RFD SURVIVA MKIV"
2. Modelos: Vê todos os modelos RFD
3. Click em primeiro modelo → Especificações mostram apenas desse
4. Volta e click no segundo → Especificações mudam
5. Pode alternar rapidamente para comparar
```

### Exemplo 3: Ver Todas as Configurações
```
1. Não seleciona marca nem modelo
2. Especificações mostra TODAS as 16 configurações
3. Pode procurar por capacidade "25p" ou modelo "LR07"
```

---

**Versão**: 2.0 (com Modelos integrados)
**Data**: Fevereiro 6, 2026
**Status**: ✅ Em produção
