# 📊 Análise e Refinamento do Quadro de Inspeção da Jangada

**Data**: 06/02/2026  
**Status**: Revisão Completa com Novas Estruturas de Dados

---

## 📋 Estado Atual da Estrutura

### ✅ O que está implementado:

1. **Componentes Base** (`QuadroInspecaoExtraction`)
   - Jangada (numeroSerie, marca, modelo, lotacao)
   - Componentes (interiores, exteriores, pack)
   - Cilindros CO2 básicos
   - Testes realizados (NAP, F3, QI, LOAD)

2. **Análise Inteligente**
   - Parsing automático de Excel com Gemini API
   - Extração de datas em múltiplos formatos
   - Classificação de componentes por localização
   - Cálculo de confiança (0-100%)

3. **Componentes de Pack Rastreáveis**
   - Fachos, Paraquedas, Rações, Água
   - Coletes, EPIRB, Sinalizadores
   - Tracking de validades (dataValidade)
   - Estados (ok, proximo_vencer, expirado)

---

## 🔴 Gaps Identificados (vs. Requisitos Sessão Anterior)

### 1. **Cilindros CO2 - Cabeça de Disparo** ⚠️
**Status**: Campos parcialmente capturados, modelo não criado

**Atual**:
```typescript
cilindros?: {
  numero?: string;
  tipo?: string;
  pressao?: number;
  gas?: string;
  validade?: string;
  dataProximo_teste?: string;
  tipoCabecaDisparo?: string;        // ← Capturado mas sem modelo
  tipoValvulas?: string;
  tiposValvulas?: string[];
}[];
```

**Necessário**: Criar modelo `CabecaDisparo` com tipos:
- VTE99
- GIST WHITE
- GIST BLACK
- DK94
- DK99

**Impacto**: Cilindros precisam rastrear cabeça, não apenas campo de string

---

### 2. **Câmaras e Válvulas de Atestar** ⚠️
**Status**: `CamaraJangada` criado na sessão anterior, mas não integrado no quadro

**Atual**:
```typescript
// Não aparece no QuadroInspecaoExtraction
```

**Necessário**: Adicionar seção no quadro para:
- Câmara Inferior (tipo: "inferior")
- Câmara Superior (tipo: "superior")
- Válvulas de Atestar (A10, B10, OTS65, etc.)
- Próximo teste de câmaras
- Estado de válvulas

---

### 3. **Sistema de Iluminação** ⚠️
**Status**: Completamente ausente

**Necessário**: Rastrear por jangada:
- Luz Exterior (com bateria de lítio)
- Luz Interior (com bateria de lítio)
- Data de validade de baterias
- Estado (ok, proximo_vencer, expirado)

**Campos esperados**:
```typescript
iluminacao?: {
  luzExterior?: {
    presente: boolean;
    bateria?: {
      tipo: string;      // "lítio"
      validade: string;  // DD/MM/YYYY
      estado: string;    // ok, proximo_vencer, expirado
    };
  };
  luzInterior?: {
    presente: boolean;
    bateria?: {
      tipo: string;
      validade: string;
      estado: string;
    };
  };
};
```

---

### 4. **Campos de Data Não Padronizados** ⚠️
**Status**: Função de parsing existe mas não aplicada consistentemente

**Problema**:
- `dataProximo_teste` (underscore inconsistente)
- Datas em múltiplos formatos: DD/MM/YYYY, MM/YYYY, DD-MM-YYYY
- Sem conversão para ISO 8601 para storage

**Solução Necessária**:
```typescript
// Função auxiliar needed
function parseDataInspecao(dataStr: string): string | null {
  // Conversa DD/MM/YYYY, DD-MM-YYYY, MM/YYYY para YYYY-MM-DD
}
```

---

## 🎯 Recomendações de Refinamento

### **Prioridade 1: Expandir QuadroInspecaoExtraction**

```typescript
export interface QuadroInspecaoExtraction {
  // ... existing fields ...
  
  // NOVO: Câmaras com válvulas de atestar
  camaras?: {
    tipo: "inferior" | "superior";
    valvulaAtestar?: {
      nome: string;           // A10, B10, OTS65, etc
      dataInstalacao?: string;
      proximoTeste?: string;
      estado?: string;        // ok, proximo_vencer
      observacoes?: string;
    };
  }[];

  // NOVO: Sistema de iluminação com baterias
  iluminacao?: {
    luzExterior?: {
      presente: boolean;
      bateria?: {
        tipo: string;
        validade: string;
        estado: string;
      };
    };
    luzInterior?: {
      presente: boolean;
      bateria?: {
        tipo: string;
        validade: string;
        estado: string;
      };
    };
  };

  // MELHORADO: Cilindros com tipo de cabeça específico
  cilindros?: CilindroInspecaoDetalhado[];
}

export interface CilindroInspecaoDetalhado {
  numero: string;
  tipo: "CO2" | "N2" | "Ar";
  pressao: number;
  gas: string;
  validade: string;
  dataProximo_teste: string;
  
  // NOVO: Referência a cabeça de disparo
  cabecaDisparo?: {
    tipo: "VTE99" | "GIST WHITE" | "GIST BLACK" | "DK94" | "DK99";
    dataInstalacao?: string;
    proximoTeste?: string;
  };
  
  // MANTER: Válvulas de funcionamento/selagem
  tiposValvulas?: string[];
}
```

---

### **Prioridade 2: Atualizar Prompt de Extração Gemini**

Adicionar ao `quadro-inspecao-analyzer.ts`:

```typescript
3. CÂMARAS (Chambers):
   - Câmara Inferior (Lower Chamber):
     * Válvula de Atestar: [tipo, data próximo teste]
   - Câmara Superior (Upper Chamber):
     * Válvula de Atestar: [tipo, data próximo teste]

4. SISTEMA DE ILUMINAÇÃO (Lighting System):
   - Luz Exterior (Exterior Light):
     * Bateria de Lítio: [tipo, validade]
   - Luz Interior (Interior Light):
     * Bateria de Lítio: [tipo, validade]

5. CABEÇA DE DISPARO (Firing Head) - por cilindro:
   - Tipo: VTE99, GIST WHITE, GIST BLACK, DK94, DK99, etc
   - Data de Instalação
   - Data Próximo Teste
```

---

### **Prioridade 3: Criar Modelos Prisma Faltantes**

Já existem:
- ✅ `ComponentePack`
- ✅ `CamaraJangada`

**Faltam**:
- ❌ `CabecaDisparo` (associada a Cilindro)
- ❌ `SistemaIluminacao` (associado a Jangada)
- ❌ `BateriaLitio` (referenciada em iluminação)

---

### **Prioridade 4: Melhorar Validações de Data**

Implementar funções de parsing consistentes:

```typescript
export function normalizarData(
  dataStr: string | undefined,
  formato?: 'DD/MM/YYYY' | 'MM/YYYY' | 'DD-MM-YYYY'
): string | null {
  if (!dataStr) return null;
  
  // Detectar formato e converter para ISO 8601
  // Retornar YYYY-MM-DD para storage seguro
}

export function calcularDiasParaVencer(dataValidade: string): number {
  // Calcula dias até vencimento
  // Retorna negativo se expirado
}
```

---

## 📈 Plano de Implementação

### **Fase 1: Expansão de Modelos** (30 min)
1. Criar `CabecaDisparo` model em Prisma
2. Criar `SistemaIluminacao` model em Prisma  
3. Criar `BateriaLitio` model em Prisma
4. Vincular às relações corretas (Cilindro, Jangada)

### **Fase 2: Atualizar Interface de Extração** (20 min)
1. Expandir `QuadroInspecaoExtraction` interface
2. Adicionar campos para câmaras, iluminação, baterias
3. Criar tipos específicos para cada componente

### **Fase 3: Melhorar Prompt Gemini** (20 min)
1. Adicionar instruções para câmaras
2. Adicionar instruções para iluminação
3. Adicionar instruções para cabeças de disparo
4. Exemplificar extração com validação de tipos

### **Fase 4: Validação e Parsing** (15 min)
1. Implementar funções de normalização de datas
2. Implementar validação de tipos (ex: cabeça disparo válida)
3. Implementar cálculo de dias para vencer

### **Fase 5: API de Importação** (30 min)
1. Atualizar `/api/jangadas/import-quadro` para processar novos campos
2. Atualizar handlers para criar registos em CabecaDisparo, SistemaIluminacao
3. Adicionar validações de confiança por seção

### **Fase 6: UI de Visualização** (20 min)
1. Expandir preview de resultados na dialog
2. Mostrar câmaras e válvulas extraídas
3. Mostrar iluminação e baterias extraídas
4. Mostrar cabeças de disparo por cilindro

---

## 🔍 Checklist de Validação

- [ ] Todos os campos do template são capturados
- [ ] Datas em múltiplos formatos são normalizadas
- [ ] Cabeças de disparo são validadas (tipos conhecidos)
- [ ] Câmaras e válvulas são extraídas com confiança >80%
- [ ] Sistema iluminação e baterias são rastreados
- [ ] Confiança geral da extração é comunicada ao usuário
- [ ] Dados incompletos geram avisos, não erros
- [ ] Stock de componentes é sincronizado automaticamente
- [ ] Histórico de inspeções anteriores é acessível

---

## 📝 Notas Técnicas

**Arquivo do Template**: `public/templates/quadro-inspecao-template.xlsx`
- Contém seções para Jangada, Componentes, Cilindros, Testes
- Deve ser atualizado para incluir Câmaras e Iluminação

**Ficheiro de Análise**: `src/lib/quadro-inspecao-analyzer.ts`
- Usa Gemini/OpenAI para parsing inteligente
- Retorna JSON estruturado
- Confiança: 0-100% baseada em campos preenchidos

**API de Importação**: `/api/jangadas/import-quadro`
- POST route que processa upload
- Integra com Prisma para storage
- Sincroniza stock automaticamente

---

## 🚀 Próximas Ações

1. **Imediato**: Criar modelos Prisma faltantes (CabecaDisparo, SistemaIluminacao)
2. **Curto Prazo**: Expandir interface QuadroInspecaoExtraction
3. **Médio Prazo**: Atualizar prompt Gemini e API
4. **Longo Prazo**: Refinar UI e adicionar validações avançadas
