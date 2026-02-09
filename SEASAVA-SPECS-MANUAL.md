# 📋 GUIA: Extrair Especificações SEASAVA Manualmente

## Situação Atual
Os PDFs encontrados são **escaneados (imagens puras)**:
- `Seasava Plus.pdf` (254 páginas)
- `Seasava Plus X E R.pdf` (152 páginas)

OCR automático requer ferramentas de sistema que não estão disponíveis. **Portanto, preciso que você extraia as informações dos PDFs manualmente.**

## 🎯 Como Proceder

### Passo 1: Abra os PDFs
- Abra em um leitor de PDF (Adobe Reader, Preview, etc.)
- Use função de busca (Ctrl+F)

### Passo 2: Localize as Tabelas

Procure por estas seções em CADA PDF:

| Buscar por... | O que você vai encontrar |
|---|---|
| **Specifications** ou **Technical Data** | Tabela principal com capacidades |
| **Capacities** | Todas as versões disponíveis (4P, 6P, 8P, 10P, 12P, 16P, 20P, 25P) |
| **Inflation System** | THANNER ou LEAFIELD |
| **Valves** | OTS65, A10, B10, etc. |
| **CO2 Weight** ou **CO2 Cylinder** | Peso em kg para cada capacidade |
| **Working Pressure** | Valor em PSI |
| **Weak Link** | Resistência em kN (Kilonewtons) |
| **Davit Launch** | Capacidades de lançamento por guindaste |

### Passo 3: Preencha as Informações

Para **CADA MODELO** (SEASAVA PLUS + SEASAVA X E R), forneça:

#### A) Informações Básicas
```
Modelo: [Nome exato]
Sistema: [THANNER ou LEAFIELD]
Válvulas: [ex: OTS65, A10, B10]
```

#### B) Para CADA CAPACIDADE (copiar toda tabela)
```
Capacidade | Cilindros | Peso CO2 (kg) | Peso N2 (kg) | Referência
    4P     |     1     |      X.XX     |    X.XX      | XXXXX
    6P     |     1     |      X.XX     |    X.XX      | XXXXX
    8P     |     1     |      X.XX     |    X.XX      | XXXXX
   10P     |     1     |      X.XX     |    X.XX      | XXXXX
   12P     |     2     |      X.XX     |    X.XX      | XXXXX
   16P     |     2     |      X.XX     |    X.XX      | XXXXX
   20P     |     3     |      X.XX     |    X.XX      | XXXXX
   25P     |     3     |      X.XX     |    X.XX      | XXXXX
```

#### C) Pressões (se encontrar tabela)
```
Pressão de Trabalho:
- PSI: X.XX
- mmWG: XXX.XX
- inH2O: XX.XX
- milibares: XXX
```

#### D) Weak Link (se encontrar)
```
Throw-over: X.X kN (XXX lbf)
Davit Launch: X.X kN (XXX lbf)
```

#### E) Davit Launch Capacities (se encontrar)
```
Modelos disponíveis: 12P, 16P, 20P, 25P, etc.
```

### Passo 4: Envie as Informações

Quando tiver os dados, fornéça-me em UMA destas formas:

**OPÇÃO A - JSON (Recomendado)**
Copie a estrutura abaixo e preencha:

```json
{
  "seasava_plus": {
    "modelo": "SEASAVA PLUS",
    "sistema": "THANNER ou LEAFIELD",
    "valvulas": ["OTS65", "A10", "B10"],
    "especificacoes": {
      "4p": {
        "cilindros_co2": 1,
        "peso_co2_kg": X.XX,
        "peso_n2_kg": X.XX,
        "referencia": "XXXXX"
      },
      "6p": { ... },
      "8p": { ... }
    },
    "pressoes": {
      "psi": X.XX,
      "mmwg": XXX.XX,
      "inh2o": XX.XX,
      "milibares": XXX
    },
    "weak_link": {
      "throw_over_kn": X.X,
      "throw_over_lbf": XXX,
      "davit_launch_kn": X.X,
      "davit_launch_lbf": XXX
    },
    "davit_capacidades": ["12P", "16P", "20P", "25P"]
  },
  "seasava_x_e_r": {
    "modelo": "SEASAVA X E R",
    "sistema": "THANNER ou LEAFIELD",
    ... (mesma estrutura)
  }
}
```

**OPÇÃO B - Text format**
Simplesmente copie e cole as tabelas que encontrar do PDF. Ex:

```
SEASAVA PLUS:
Modelo: SEASAVA PLUS
Sistema: THANNER
Válvulas: OTS65, A10, B10

Capacidades:
4P   - 1 cilindro, 1.98 kg CO2
6P   - 1 cilindro, 2.98 kg CO2
12P  - 2 cilindros, 8.96 kg CO2
...
```

**OPÇÃO C - Screenshots**
Tire screenshots das tabelas principais e eu analiso visualmente.

## 💡 Dicas de Busca nos PDFs

1. **Abra o PDF** em leitor (Adobe, com Ctrl+F)
2. **Procure por padrões**:
   - Números com "P" (4P, 6P, 8P, 12P, etc.)
   - "kg" (peso de CO2)
   - "PSI" (pressão)
   - "kN" (weak link)
3. **Páginas com dados**:
   - Geralmente **primeiras 50 páginas** têm índice/sumário
   - Especificações técnicas entre **páginas 30-80**
   - Tabelas de detalhes entre **páginas 50-120**
   - Certificados/specs de segurança nas **últimas 30 páginas**

## 📝 Formato Preferido

**Envie em JSON** (OPÇÃO A) - É exatamente o formato que preciso para criar os scripts!

## ⚠️ Informações Críticas (NÃO ESQUEÇA)

Para cada modelo, OBRIGATÓRIO ter:
- ✅ Nome exato do modelo
- ✅ Sistema (THANNER ou LEAFIELD)
- ✅ Todas as capacidades disponíveis (pode ser 4P a 25P ou subconjunto)
- ✅ Pesos de CO2 em kg
- ✅ Pelo menos UMA pressão em PSI

Com essas informações, crio automaticamente:
1. `add-rfd-seasava-plus.ts` - Adiciona SEASAVA PLUS ao banco de dados
2. `add-rfd-seasava-xe-r.ts` - Adiciona SEASAVA X E R ao banco de dados
3. Todos os testes (WP, NAP, B, FS)
4. Pressões em todas as unidades (PSI, mmWG, inH2O, milibares)
5. Weak Link
6. Davit Launch specs

---

**Quando tiver os dados, envie e começamos! 👍**
