# Sistema de Gestão de Certificados, Obras e Inspeções

## 📋 Visão Geral

Sistema completo para gestão e rastreamento de certificados, obras e inspeções de jangadas salva-vidas, integrado com a aplicação Gestor Naval Pro.

## 🗂️ Estrutura de Pastas

```
gestor-naval-pro/
├── certificates/          # Certificados digitais
│   ├── AZ26-001.xls
│   ├── AZ26-002.xlsx
│   └── CERTIFICADO_AZ26-001_DETALHADO.xlsx
│
├── obras/                 # Folhas de obra e manutenção
│   ├── FO10260001.xlsx
│   ├── FO10260002.xlsx
│   └── OBRA_FO10260001_DETALHADA.xlsx
│
├── quadros-inspecao/     # Quadros e checklists de inspeção
│   ├── 5086010100001 2026.xls
│   ├── 5086010100002_2026-02-05.xlsx
│   └── INSPECAO_5086010100001_GERAL_2026-01-01.xlsx
│
└── REGISTRO-*.json/.md   # Registros de relacionamentos
```

## 🔗 Relacionamentos

O sistema permite vincular:
- **Certificados** ↔ **Obras** ↔ **Inspeções**
- **Jangadas** com seus documentos
- **Agenda** de manutenções e inspeções
- **Stock** de materiais utilizados

## 📄 Tipos de Ficheiros Excel

### 1. Quadro de Inspeção
Estrutura completa com 5 folhas:
- **Informações**: Dados gerais (número série, data, técnico)
- **Inspeção Visual**: 10 itens (embalagem, marcação, HRU, etc.)
- **Inspeção Mecânica**: 10 itens (insuflação, válvulas, cilindros)
- **Segurança**: 10 itens (kit primeiros socorros, pirotécnicos, etc.)
- **Resumo**: Ações recomendadas e assinaturas

### 2. Folha de Obra
Estrutura completa com 6 folhas:
- **Informações**: Código, título, tipo, jangada, datas
- **Serviços**: Lista de serviços a executar
- **Material**: Material utilizado com stock e valores
- **Mão de Obra**: Técnicos, horas e custos
- **Testes**: Testes e verificações realizadas
- **Orçamento**: Custos totais e IVA

### 3. Certificado
Estrutura com 1 folha:
- Número do certificado
- Dados da jangada certificada
- Resultado da inspeção
- Validade
- Assinaturas

## 🚀 Como Usar

### Criar Ficheiros via Script

```bash
# Criar ficheiros de exemplo
npx tsx scripts/create-inspection-obra-files.ts

# Criar ficheiros para registro específico
npx tsx scripts/create-reg-2026-001-files.ts
```

### Criar Ficheiros via API

```typescript
// POST /api/documents/generate-excel

// Criar Inspeção
{
  "type": "inspecao",
  "data": {
    "numeroSerie": "5086010100001",
    "dataInspecao": "2026-01-01",
    "tecnico": "Julio Correia",
    "tipo": "GERAL",
    "resultado": "APROVADA"
  }
}

// Criar Obra
{
  "type": "obra",
  "data": {
    "codigo": "FO10260001",
    "titulo": "Manutenção Geral",
    "tipo": "MANUTENCAO",
    "jangadaNumeroSerie": "5086010100001",
    "status": "CONCLUIDA"
  }
}

// Criar Certificado
{
  "type": "certificado",
  "data": {
    "numero": "AZ26-001",
    "dataEmissao": "2026-02-01",
    "dataValidade": "2027-02-01",
    "entidadeEmissora": "OREY"
  }
}
```

## 🗄️ Integração com Base de Dados

### Models Prisma Atualizados

#### Certificado
```prisma
model Certificado {
  // ... campos existentes
  nome              String?
  filePath          String?
  notas             String?
  obraId            String?
  inspecaoId        String?
  
  obra              Obra?
  inspecao          Inspecao?
}
```

#### Obra
```prisma
model Obra {
  // ... campos existentes
  codigo            String?  @unique
  tipo              String?
  filePath          String?
  jangadaId         String?
  inspecaoId        String?
  
  jangada           Jangada?
  inspecao          Inspecao?
  certificados      Certificado[]
}
```

#### Inspecao
```prisma
model Inspecao {
  // ... campos existentes
  numeroSerieJangada String?
  filePath          String?
  
  obras             Obra[]
  certificados      Certificado[]
}
```

## 📊 Exemplo de Registro Completo

**REG-2026-001**: Jangada 5086010100001

1. **Inspeção** (01/01/2026) → Identificou necessidade de manutenção
2. **Obra** FO10260001 (Janeiro/2026) → Manutenção executada
3. **Certificado** AZ26-001 (Fevereiro/2026) → Certificação emitida

Ver: [REGISTRO-5086010100001-AZ26-001.md](REGISTRO-5086010100001-AZ26-001.md)

## 📝 Convenções de Nomenclatura

### Inspeções
```
INSPECAO_[NUMERO-SERIE]_[TIPO]_[DATA].xlsx
Exemplo: INSPECAO_5086010100001_GERAL_2026-01-01.xlsx
```

### Obras
```
OBRA_[CODIGO].xlsx
Exemplo: OBRA_FO10260001_DETALHADA.xlsx
```

### Certificados
```
CERTIFICADO_[NUMERO].xlsx
Exemplo: CERTIFICADO_AZ26-001_DETALHADO.xlsx
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `create-inspection-obra-files.ts` | Cria ficheiros Excel de exemplo |
| `create-reg-2026-001-files.ts` | Cria ficheiros para registro específico |

## 📦 Dependências

```json
{
  "xlsx": "^0.18.5" // Biblioteca para criar/ler ficheiros Excel
}
```

## 🛠️ Próximos Passos

- [ ] Interface web para gerar ficheiros
- [ ] Upload e parsing de ficheiros Excel existentes
- [ ] Relatórios consolidados automáticos
- [ ] Notificações de validades de certificados
- [ ] Integração com agenda automática

## 📞 Suporte

Para questões ou sugestões, contactar o técnico responsável.

---

**Última atualização**: 05/02/2026
**Versão**: 1.0.0
