# Sistema de Importação de Quadros de Inspeção da Jangada

## 📋 Visão Geral

Este sistema permite importar e analisar automaticamente ficheiros Excel do "Quadro de Inspeção da Jangada" usando Inteligência Artificial (Google Gemini).

**Dados Extraídos Automaticamente:**
- ✅ Número de série da jangada
- ✅ Marca e modelo
- ✅ Lotação (capacidade)
- ✅ Número do certificado
- ✅ Datas de inspeção
- ✅ Componentes interiores, exteriores e de pack
- ✅ Validades dos componentes
- ✅ Cilindros CO2 com pressões e validades
- ✅ Resultados de testes
- ✅ Observações e notas

## 🗂️ Estrutura de Ficheiros

```
src/
├── lib/
│   ├── document-analyzer.ts          # Analisador genérico de documentos
│   └── quadro-inspecao-analyzer.ts   # Analisador especializado para Quadro de Inspeção
├── app/
│   └── api/
│       └── jangadas/
│           └── import-quadro/
│               └── route.ts          # API endpoint para importação
├── components/
│   └── ui/
│       └── quadro-inspecao-upload.tsx # Componente de upload
├── hooks/
│   └── use-quadro-inspecao-import.ts # Hook para gerenciar estado
└── app/
    └── jangadas/
        ├── import-quadro/
        │   └── page.tsx              # Página dedicada de importação
        └── page.tsx                  # Lista de jangadas (com botão integrado)
```

## 🚀 Como Usar

### 1. Upload via Interface Web

**Opção A: Página Dedicada**
- Aceda a `/jangadas/import-quadro`
- Clique em "Importar Quadro de Inspeção"
- Arraste ou selecione o ficheiro Excel

**Opção B: Lista de Jangadas**
- Aceda a `/jangadas`
- Clique em "Importar Quadro de Inspeção" no canto superior direito

### 2. Processo Automático

```
1. Upload do ficheiro Excel
   ↓
2. Análise com Google Gemini IA
   ↓
3. Extração de dados estruturados
   ↓
4. Validação de confiança
   ↓
5. Importação para base de dados
   ↓
6. Atualização automática de stock
   ↓
7. Geração de certificado
```

## 📊 Formato Esperado do Excel

O ficheiro deve conter um layout semelhante ao "Quadro de Inspeção da Jangada" da OREY Técnica Naval:

### Seção 1: Informações da Jangada
```
Número de Série:        6017330300330
Navio:                  MESTRE MIGUEL
Técnico Responsável:    [Nome]
Marca/Modelo:           RFD SEASAVE PLUS R
Lotação:                8
Certificado Nº:         AZ25-002
Data de Inspeção:       07-01-2025
Data Próxima Inspeção:  [Data]
```

### Seção 2: Componentes Interiores
```
- Coletes Salva-Vidas [quantidade, estado, validade]
- EPIRB [estado]
- Cilindro CO2 [pressão, tipo]
- Válvulas [estado, validade]
- [... mais componentes]
```

### Seção 3: Componentes Exteriores
```
- Proteções Juntas [estado]
- Válvulas Atenuador [estado]
- Amarras Técnicas [estado]
- [... mais componentes]
```

### Seção 4: Itens do Pack
```
- [Componentes que fazem parte do pack equipado]
- [Com validades e estados]
```

### Seção 5: Cilindros CO2
```
Cilindro Nº:           [Identificação]
Tipo:                  CO2/Ar/Nitrogénio
Pressão:               [bar]
Validade:              [MM/YYYY]
Data Próximo Teste:    [DD/MM/YYYY]
```

## 🔌 API Endpoint

### POST `/api/jangadas/import-quadro`

**Requisição:**
```bash
curl -X POST http://localhost:3000/api/jangadas/import-quadro \
  -F "file=@quadro-inspecao.xlsx"
```

**Resposta Sucesso (200):**
```json
{
  "success": true,
  "jangada": {
    "id": "cuid123",
    "numeroSerie": "6017330300330",
    "tipo": "Jangada Pneumática",
    "status": "ativo",
    "updatedAt": "2025-02-03T10:30:00Z"
  },
  "componentes": {
    "interiores": [
      {
        "nome": "Coletes Salva-Vidas",
        "quantidade": 8,
        "estado": "OK",
        "validade": "06/2027",
        "localizacao": "interior"
      }
    ],
    "exteriores": [],
    "pack": []
  },
  "cilindros": [
    {
      "numero": "17W63103",
      "tipo": "CO2",
      "pressao": 57.25,
      "gas": "CO2",
      "validade": "12/2026"
    }
  ],
  "certificado": {
    "id": "cert123",
    "numero": "AZ25-002",
    "dataValidade": "2026-01-07T00:00:00Z"
  },
  "errors": [],
  "warnings": [],
  "confianca": 92,
  "stockSync": {
    "totalComponents": 15,
    "updates": [
      {
        "nome": "Coletes Salva-Vidas",
        "action": "decreased",
        "quantidade": 8
      }
    ]
  }
}
```

**Resposta Erro (400/500):**
```json
{
  "error": "Ficheiro não parece ser um Quadro de Inspeção da Jangada",
  "errors": ["Número de série não identificado"],
  "warnings": ["Confiança baixa"],
  "confianca": 35
}
```

## 🎯 Funcionalidades Principais

### 1. **Análise Inteligente com IA**
- Usa Google Gemini 1.5 Flash para precisão máxima
- Baixa temperatura (0.1) para consistência
- Retry automático com backoff exponencial

### 2. **Extração Estruturada**
- Componentes categorizados (interior/exterior/pack)
- Datas parseadas em formato DD/MM/YYYY
- Válidades extraídas automaticamente

### 3. **Sincronização Automática**
- Atualiza stock baseado em componentes extraídos
- Cria/atualiza jangada na base de dados
- Gera certificado automaticamente

### 4. **Validação e Confiança**
- Verifica completude dos dados
- Calcula score de confiança (0-100)
- Avisos para dados incompletos

### 5. **Gestão de Erros**
- Tratamento robusto de exceções
- Mensagens claras de erro
- Sugestões de correção

## 📱 Hook de Integração

Para usar em componentes customizados:

```typescript
import { useQuadroInspecaoImport } from '@/hooks/use-quadro-inspecao-import';

export function MyComponent() {
  const { isLoading, error, result, confianca, importQuadro } = useQuadroInspecaoImport();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await importQuadro(file);
      console.log('Resultado:', result);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isLoading} />
      {isLoading && <p>Analisando...</p>}
      {error && <p>Erro: {error}</p>}
      {result && <p>Confiança: {confianca}%</p>}
    </div>
  );
}
```

## 🔐 Variáveis de Ambiente

Certifique-se de ter configurado:

```env
GOOGLE_AI_API_KEY=sua_chave_api_google_gemini
```

## 📊 Exemplo Completo

Ficheiro de entrada: `quadro-inspecao-jangada.xlsx`

**Dados Extraídos:**
```
Jangada:
  - Série: 6017330300330
  - Marca: RFD SEASAVE
  - Modelo: PLUS R
  - Lotação: 8
  - Certificado: AZ25-002
  - Inspeção: 07-01-2025
  - Próxima: 07-01-2026

Componentes (48 itens):
  - 8 Coletes (OK, validade 06/2027)
  - 2 EPIRB (OK)
  - 1 Cilindro CO2 (57.25 bar, validade 12/2026)
  - ...

Stock Atualizado:
  - Coletes: -8
  - CO2 Cilindro: -1
  - ...

Certificado Criado:
  - Nº: AZ25-002
  - Validade: 07-01-2026
```

## 🛠️ Troubleshooting

### "Ficheiro não é um Quadro de Inspeção"
- Verificar que o nome do ficheiro contém "Quadro" ou "Inspeção"
- Verificar que a folha (sheet) tem nome semelhante

### "Número de série não identificado"
- Certificar que o número de série está presente no Excel
- Pode estar numa coluna diferente da esperada

### "Confiança baixa (< 40%)"
- Verificar estrutura do Excel
- Certificar que dados importantes estão preenchidos

### "Erro de sincronização de stock"
- Verificar se os itens existem no catálogo de stock
- Usar nomes de componentes que correspondem ao stock

## 📈 Próximas Melhorias

- [ ] Suporte para múltiplas folhas Excel
- [ ] Importação de imagens/PDFs
- [ ] Histórico de importações
- [ ] Validação de regras de negócio
- [ ] Alertas para expiração próxima
- [ ] Exportação de relatórios
- [ ] Integração com OneDrive

## 📞 Suporte

Para questões ou bugs, consulte a documentação da IA em `src/lib/quadro-inspecao-analyzer.ts`
