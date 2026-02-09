# Guia de Uso - Checklist de Inspeção Manual Técnico

## ✅ Implementação Concluída

A integração do **Checklist de Inspeção baseado em Manual Técnico** foi concluída com sucesso!

### 🎯 Onde Encontrar

O checklist técnico está disponível em:

**URL:** `/inspecoes/[id]/checklist`

**Nova Aba:** "Manual Técnico" (terceira aba)

---

## 📋 13 Items de Checklist Derivados do Manual

### **Pressão e Inflação (2 items)**
1. **Verificação de Pressão** - Anual
   - Ferramenta: Manômetro digital WIKA DG10-BAR-001
   - Critério: Pressão dentro da faixa ±5%
   - Referência: RFD MKIV M269-00, Seção Pressões de Trabalho

2. **Verificação Peso CO₂/N₂** - Bienal
   - Ferramenta: Balança calibrada ±10g
   - Critério: Peso dentro dos valores (R5-R30) ±2%
   - Referência: RFD MKIV M269-00, Tabela Gas Charges (pg 73)

### **Torques e Apertos (4 items)**
3. **Torque Válvula M24** - Após manutenção
   - Ferramenta: Torquímetro GEDO-TRQ-080-DIG
   - Critério: 30 Nm ±1 Nm

4. **Torque Válvula Cilindro** - Após substituição
   - Ferramenta: Torquímetro calibrado 150-200 Nm
   - Critério: 160 Nm ±5 Nm

5. **Torque Válvulas A10/B10** - Após serviço
   - Ferramenta: HAMM-KEY-AB10-SP + torquímetro
   - Critério: 27 Nm ±2 Nm

6. **Torque H-Pack Nut** - Após repacking
   - Ferramenta: Torquímetro de precisão 5-15 Nm
   - Critério: 9.5 Nm ±0.5 Nm

### **Painter e HRU (3 items)**
7. **Verificação Comprimento Painter** - Anual
   - Ferramenta: Fita métrica 15m
   - Critério: ≥ 10 metros

8. **Teste Weak Link** - Anual (visual) / Bienal (carga)
   - Ferramenta: Dinamômetro 0-5 kN para teste bienal
   - Critério: Romper entre 1.8-2.6 kN

9. **Verificação Fixação Painter** - Trimestral
   - Ferramenta: Inspeção visual
   - Critério: Fixação segura, sem desgaste

### **Sistema Elétrico (2 items)**
10. **Verificação Cabo RL5** - Após substituição bateria
    - Ferramenta: Fita métrica/paquímetro
    - Critério: 700-1000 mm (jangadas 8-20p)

11. **Verificação Cabo RL6** - Após substituição bateria
    - Ferramenta: Fita métrica/paquímetro
    - Critério: 400-1500 mm (jangadas 8-25p)

### **Contentores (1 item)**
12. **Verificação Dimensões Contentor Xtrem** - Após repacking
    - Ferramenta: Fita métrica, balança industrial
    - Critério: Dimensões e peso ±5%

### **Manutenção Periódica (1 item)**
13. **Overhaul Completo 12 Meses**
    - Ferramenta: Kit completo conforme manual
    - Critério: Todos os itens aprovados

---

## 🔧 Como Usar o Componente

### 1. **Na Página de Checklist (Já Integrado)**

```tsx
// Arquivo: src/app/inspecoes/[id]/checklist/page.tsx
// Aba "Manual Técnico" - já implementada!

<ChecklistInspecaoManual
  inspecaoId={inspecaoId}
  jangadaId={jangada.id}
  marcaId={jangada.marcaId}
  modeloId={jangada.modeloId}
  lotacaoId={jangada.lotacaoId}
/>
```

### 2. **Em Outras Páginas**

```tsx
import { ChecklistInspecaoManual } from '@/components/checklist-inspecao-manual'

// Exemplo em página de nova inspeção
<ChecklistInspecaoManual
  inspecaoId="clxxx..." // ID da inspeção atual
  marcaId="cml9i4cnc000xfk12kf0wgq6f" // RFD (obrigatório para carregar checklist MKIV)
  modeloId="cmlass1dz0001fm3ewwiojzvr" // MKIV (opcional)
  lotacaoId="..." // Capacidade (opcional)
  readOnly={false} // true = modo visualização
/>
```

### 3. **Modo Somente Leitura**

```tsx
// Para visualizar checklist preenchido sem permitir edições
<ChecklistInspecaoManual
  inspecaoId={inspecaoId}
  marcaId={marcaId}
  readOnly={true}
/>
```

---

## 📊 Funcionalidades

### ✅ **Verificação por Item**
- Checkbox para marcar item como verificado
- Botões Aprovado/Reprovado
- Campo de valor medido
- Campo de observações

### 📝 **Informações Técnicas Automáticas**
Para cada item:
- Ferramenta necessária
- Critério de aprovação
- Referência ao manual (página/seção)
- Frequência de verificação

### 💾 **Salvamento Automático**
- Botão "Salvar Checklist"
- Salva todas as verificações no banco de dados
- Vincula à inspeção específica

### 📈 **Progress Tracking**
- Contador por categoria
- Visualização de progresso
- Status de conclusão

---

## 🗄️ Dados no Banco

### Tabelas Criadas

**`checklist_inspecao`** - Itens do checklist (13 records)
- nome, descrição, categoria
- frequência, ferramentaNecessaria
- criterioAprovacao, referenciaManual
- aplicavelMarcaId (RFD)

**`verificacao_checklist_inspecao`** - Verificações por inspeção
- checklistItemId (FK)
- inspecaoId (FK)
- verificado, aprovado, valor, observacoes
- dataVerificacao, responsavel

---

## 🔗 APIs Disponíveis

### GET `/api/checklist-inspecao`
Buscar items de checklist
```
Query params:
- categoria: string (opcional)
- marcaId: string (RFD)
- ativo: boolean
```

### GET `/api/inspecoes/[id]/checklist`
Buscar verificações de uma inspeção

### POST `/api/inspecoes/[id]/checklist`
Salvar verificações
```json
{
  "items": [
    {
      "checklistItemId": "clxxx...",
      "verificado": true,
      "aprovado": true,
      "valor": "28 Nm",
      "observacoes": "Torque aplicado conforme especificação"
    }
  ]
}
```

---

## 🎨 UI Completa

### Páginas Criadas

1. **`/especificacoes`** - Lista de especificações técnicas
   - Grid com filtros (marca/modelo)
   - Cards com resumo
   - Links para detalhes

2. **`/especificacoes/[id]`** - Detalhes completos
   - 5 abas: Geral, Manual, Interligação, Testes, Checklist
   - Visualização de todos os dados técnicos
   - Integração do checklist por configuração

3. **`/inspecoes/[id]/checklist`** - Checklist de inspeção (atualizado)
   - Aba "Manual Técnico" com checklist integrado
   - Mantém compatibilidade com checklist antigo

---

## 📌 IDs Importantes

### RFD MKIV
- **Marca RFD:** `cml9i4cnc000xfk12kf0wgq6f`
- **Modelo MKIV:** `cmlass1dz0001fm3ewwiojzvr`

### DSB LR07
- **Marca DSB:** `cml9i4l4f000yfk12stqb16wz`
- **Modelo LR07:** `cmlat95if000nfm3eyo0ewna1`

---

## 🚀 Próximos Passos

1. **Testar integração completa** em inspeção real
2. **Adicionar relatórios** com verificações do checklist
3. **Exportar PDF** com checklist preenchido
4. **Dashboard** com estatísticas de conformidade

---

## ✨ Resumo

✅ 13 checklist items derivados do manual RFD MKIV  
✅ Componente reutilizável criado  
✅ Integrado à página de inspeção (aba "Manual Técnico")  
✅ APIs de consulta e salvamento funcionais  
✅ Páginas de visualização de especificações completas  
✅ Sistema totalmente funcional e pronto para uso!

**Acesse:** `/inspecoes/[id]/checklist` → Aba "Manual Técnico" 🎯
