# GUIA DE EXTRAÇÃO MANUAL - ESPECIFICAÇÕES SEASAVA

## 📋 SITUAÇÃO ATUAL

Os PDFs fornecidos são **escaneados** (imagens puras, sem texto editável):
- `Seasava Plus.pdf` - 254 páginas
- `Seasava Plus X E R.pdf` - 152 páginas

Para extrair as especificações técnicas completas, será necessário **análise manual** dos PDFs.

---

## 🎯 OBJETIVO

Extrair especificações técnicas completas de ambos os modelos SEASAVA e preencher o arquivo:
**`SEASAVA-TEMPLATE-SPECS.json`**

---

## 📖 PÁGINAS-CHAVE PARA LOCALIZAR

Ao abrir cada PDF, procure estas seções/tabelas:

### 1. **ÍNDICE / TABLE OF CONTENTS**
   - Geralmente nas primeiras 3-10 páginas
   - Anote os números das páginas das seguintes seções:
     - Technical Specifications / Especificações Técnicas
     - Gas Cylinder Data / Dados de Cilindros
     - Davit Launch Specifications
     - Valve Information / Informações de Válvulas
     - Pressure Testing / Testes de Pressão
     - Weak Link Specifications

### 2. **TABELA DE CAPACIDADES**
   - Procure por tabela com colunas:
     - Capacity (4P, 6P, 8P, 10P, 12P, 16P, 20P, 25P)
     - CO2 Cylinder (ex: 2 x 160g, 1 x 350g)
     - Weight (peso total em kg)
     - Container Dimensions (dimensões)
   
### 3. **SISTEMA DE INSUFLAÇÃO**
   - Procure por: "Inflation System"
   - Tipos comuns: **Thanner**, **Leafield**
   - Pode estar nas especificações gerais

### 4. **VÁLVULAS**
   - Procure por: "Valves", "Valve Type"
   - Padrões comuns:
     - **OTS65** (válvula sobrepressão)
     - **A10**, **B10**, **C8**, **D5** (válvulas de inflação/deflação)

### 5. **PRESSÕES DE TRABALHO**
   - Procure por: "Working Pressure", "Inflation Pressure"
   - Extraia TODOS os valores:
     - **PSI** (ex: 2.8 PSI)
     - **mmWG** (ex: 550 mmWG)
     - **inH2O** (ex: 21.6 inH2O)
     - **mbar** (ex: 193 mbar)

### 6. **WEAK LINK SPECIFICATIONS**
   - Procure por: "Weak Link"
   - Dois tipos:
     - **Throw-Over** (lançamento sobre bordo)
     - **Davit Launch** (lançamento por turco)
   - Valores em:
     - **kN** (ex: 2.2 kN, 3.6 kN)
     - **lbf** (ex: 500 lbf, 800 lbf)

### 7. **TORQUES DE APERTO**
   - Procure por: "Tightening Torque", "Torque Specifications"
   - Valores em **Nm** (Newton-metro)
   - Exemplos:
     - Válvulas: 2-5 Nm
     - Cilindros: 10-15 Nm

### 8. **DAVIT LAUNCH**
   - Procure por: "Davit Launchable", "DL"
   - Identifique quais capacidades têm opção Davit
   - Weak link específico para DL

---

## 📝 COMO PREENCHER O TEMPLATE

### Exemplo de preenchimento para **capacidade 6P**:

```json
"6P": {
  "capacidade_pessoas": 6,
  "cilindros_co2": {
    "quantidade": 2,              // ← Exemplo: "2 x 160g"
    "peso_individual_g": 160,     // ← 160 gramas por cilindro
    "peso_total_kg": 0.320,       // ← 2 × 160g = 320g = 0.320kg
    "peso_total_n2_kg": null      // ← Se não houver N2, deixar null
  },
  "referencia_cilindro": "REF123",  // ← Código de referência se disponível
  "peso_embalado_kg": 45.5,       // ← Peso total da jangada embalada
  "dimensoes_container_mm": {
    "comprimento": 700,           // ← Em milímetros
    "largura": 400,
    "altura": 350
  }
}
```

### Exemplo de **Sistema de Insuflação**:

```json
"sistema_insuflacao": {
  "tipo": "Thanner / Leafield",  // ← Pode ser um ou ambos
  "descricao": "Sistema Thanner para insuflação automática"
}
```

### Exemplo de **Válvulas**:

```json
"valvulas_padrao": {
  "tipos": ["OTS65", "A10", "B10", "C8"],  // ← Lista todas encontradas
  "descricao": "OTS65 (sobrepressão), A10/B10 (inflação), C8 (válvula auxiliar)"
}
```

### Exemplo de **Pressões**:

```json
"pressao_trabalho": {
  "PSI": 2.8,           // ← Extrair do manual
  "mmWG": 550,          // ← Extrair do manual
  "inH2O": 21.6,        // ← Extrair do manual
  "mbar": 193,          // ← Extrair do manual
  "observacoes": "Pressão da câmara principal após insuflação completa"
}
```

### Exemplo de **Weak Link**:

```json
"weak_link_specifications": {
  "throw_over": {
    "kN": [2.2, 3.0],       // ← Valores encontrados
    "lbf": [500, 675]       // ← Equivalentes
  },
  "davit": {
    "kN": [3.6, 4.0],       // ← Para modelos DL
    "lbf": [800, 900]
  },
  "observacoes": "Weak link varia por capacidade"
}
```

---

## 🔍 ESTRATÉGIA DE BUSCA RÁPIDA

### Para **Seasava Plus.pdf** (254 páginas):

1. **Páginas 1-20**: Índice, introdução, visão geral
2. **Páginas 20-50**: Especificações técnicas gerais
3. **Páginas 50-100**: Tabelas de capacidades e cilindros
4. **Páginas 100-150**: Procedimentos de manutenção
5. **Páginas 150-200**: Peças de reposição
6. **Páginas 200-254**: Apêndices, diagramas

### Para **Seasava Plus X E R.pdf** (152 páginas):

1. **Páginas 1-15**: Índice, diferenças entre versões (X/E/R)
2. **Páginas 15-40**: Especificações por versão
3. **Páginas 40-80**: Tabelas técnicas
4. **Páginas 80-120**: Procedimentos
5. **Páginas 120-152**: Apêndices

---

## ✅ CHECKLIST DE EXTRAÇÃO

Para CADA modelo (Plus e Plus X/E/R), extrair:

- [ ] Nome exato do modelo
- [ ] Sistema de insuflação (Thanner/Leafield)
- [ ] Válvulas padrão (OTS65, A10, B10, etc.)
- [ ] Para CADA capacidade disponível (4P a 25P):
  - [ ] Quantidade de cilindros CO2
  - [ ] Peso individual dos cilindros (g)
  - [ ] Peso total de CO2 (kg)
  - [ ] Peso de N2 se aplicável
  - [ ] Referência do cilindro
  - [ ] Peso total embalado (kg)
  - [ ] Dimensões do container (mm)
- [ ] Pressões de trabalho (PSI, mmWG, inH2O, mbar)
- [ ] Capacidades Davit Launch
- [ ] Weak Link specifications (kN e lbf)
- [ ] Torques de aperto (Nm)
- [ ] Características especiais do modelo

---

## 🚀 PRÓXIMOS PASSOS

### OPÇÃO A - Extração Manual Completa
1. Abrir ambos os PDFs
2. Seguir este guia página por página
3. Preencher `SEASAVA-TEMPLATE-SPECS.json`
4. Validar os dados preenchidos

### OPÇÃO B - OCR Automatizado (requer instalação)
1. Instalar Tesseract OCR manualmente:
   - Download: https://github.com/UB-Mannheim/tesseract/wiki
   - Instalar em `C:\Program Files\Tesseract-OCR\`
2. Instalar dependências Python:
   ```bash
   pip install pytesseract pillow
   ```
3. Executar script de OCR nas páginas específicas

### OPÇÃO C - Páginas Específicas
Informe as páginas-chave e eu crio um script para extração direcionada:
- "Página 45 do Seasava Plus tem a tabela de cilindros"
- "Página 12 do Plus X E R tem weak link specs"

---

## 📞 INFORMAÇÕES ADICIONAIS

Se você puder fornecer:
- **Números de páginas específicas** com tabelas de specs
- **Screenshots** das tabelas principais
- **Texto copiado** de qualquer parte editável

Posso ajustar os scripts para extração mais precisa!

---

## 💾 ARQUIVO GERADO

**`SEASAVA-TEMPLATE-SPECS.json`** - Template estruturado pronto para preenchimento

Execute após preencher:
```bash
python -m json.tool SEASAVA-TEMPLATE-SPECS.json
```

Para validar a sintaxe JSON.
