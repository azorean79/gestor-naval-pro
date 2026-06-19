# FASE 2 — Backlog Técnico (Ordens de Serviço)

Data: 2026-03-15  
Estado: **COMPLETO** — todos os EPICs implementados

---

## Objetivo da Fase 2

Transformar a OT da Fase 1 (criação/listagem/estado) em **fluxo operacional completo**:

1. Planeamento e capacidade por técnico
2. Execução técnica estruturada (checklist + tempos + anexos)
3. Consumo/reserva de stock na OT
4. Fecho operacional e comercial (custos/IVA/documentos)
5. KPIs operacionais para gestão

---

## Princípios de implementação

- Evolução incremental sem quebrar Fase 1
- Compatibilidade retroativa das APIs existentes
- Novos campos opcionais primeiro, obrigatórios só depois de migração
- Auditoria e rastreabilidade em todas as alterações críticas

---

## EPIC A — Planeamento Operacional ✅

### A1. Capacidade por técnico e agenda OT
**Resultado esperado:** distribuir OTs por técnico com visibilidade de carga e atraso.

**Backend**
- [x] `prisma/schema.prisma` — entidade `Tecnico` + campos `slaHoras`, `dataPlaneadaInicio`, `dataPlaneadaFim`
- [x] `src/app/api/ordens-servico/route.ts` — filtros por técnico, prioridade, atraso, janela temporal
- [x] `src/app/api/ordens-servico/[id]/route.ts` — atualização de planeamento (datas, técnico, prioridade)

**Frontend**
- [x] `src/app/ordens-servico/page.tsx` — filtros rápidos + ordenação por urgência/SLA
- [x] `src/app/ordens-servico/[id]/page.tsx` — bloco de planeamento (datas previstas + técnico)

**Critérios de aceitação**
- [x] OT pode ser planeada com técnico e janela temporal
- [x] lista mostra atrasos claramente

---

## EPIC B — Execução Técnica na OT ✅

### B1. Checklist técnica por tipo ✅
**Resultado esperado:** cada OT tem passos técnicos rastreáveis.

**Backend**
- [x] `prisma/schema.prisma` — entidades `OrdemServicoChecklistItem`, `OrdemServicoLog`
- [x] `src/app/api/ordens-servico/[id]/route.ts` — endpoints para atualizar checklist, notas e logs

**Frontend**
- [x] `src/app/ordens-servico/[id]/page.tsx`
  - secção checklist por tabs (pré, intervenção, validação)
  - histórico de mudanças (timeline)

**Critérios de aceitação**
- [x] cada item de checklist tem estado + timestamp + utilizador
- [x] alteração de estado da OT gera log

### B2. Registo de tempos e mão-de-obra ✅

**Backend**
- [x] `prisma/schema.prisma` — `OrdemServicoTempo` (início/fim/duração/técnico)
- [x] `/api/ordens-servico/[id]/tempos` — iniciar/parar trabalho com logs de auditoria

**Frontend**
- [x] botão iniciar/parar execução na OT
- [x] total de minutos/horas acumuladas
- [x] tabela histórico de registos de tempo

---

## EPIC C — Integração Stock ↔ OT ✅

### C1. Reserva e consumo de artigos na OT ✅
**Resultado esperado:** o stock é reservado/abatido dentro da OT.

**Backend**
- [x] `prisma/schema.prisma` — materiais armazenados em metadados JSON da OT
- [x] `/api/ordens-servico/[id]/materiais` — adicionar/remover/reservar/consumir
  - consumo usa `prisma.$transaction` com `MovimentacaoStock`
- [x] `/api/stock` — disponibilidade consultada ao adicionar material

**Frontend**
- [x] `src/app/ordens-servico/[id]/page.tsx`
  - painel "Materiais da OT" com pesquisa stock
  - linha com qtd. prevista, usada, preço unitário
  - botões Reservar / Consumir / Remover com estados visuais

**Critérios de aceitação**
- [x] ao consumir, quantidades são abatidas via transação Prisma
- [x] material sem stock bloqueia com erro auditado

---

## EPIC D — Fecho Operacional e Comercial ✅

### D1. Fecho formal da OT ✅

**Backend**
- [x] validação de pré-condições de fecho: checklist, materiais, tempos
- [x] snapshot final em metadados da OT (`closureSnapshot`)

**Frontend**
- [x] wizard de fecho com 4 passos (checklist → materiais → tempos → confirmar)
- [x] resumo comercial: subtotal + IVA + total

### D2. Documento comercial (proforma/fatura-base) ✅

**Backend**
- [x] `/api/ordens-servico/[id]/documento` — payload comercial final
- [x] exportação JSON e PDF (jsPDF)

**Frontend**
- [x] botão "Gerar documento OT" (JSON) e "Exportar PDF OT" (PDF)
- [x] PDF inclui cliente, ativo, linhas com preços, totais com IVA

---

## EPIC E — KPIs e Monitorização ✅

### E1. Painel operacional OT ✅

**Backend**
- [x] `/api/ordens-servico/kpis`
  - lead time médio (dataAbertura → dataConclusao)
  - OTs por estado
  - OTs por técnico
  - total e contagem de atrasos (dataPlaneadaFim ultrapassada)

**Frontend**
- [x] `src/app/dashboard/page.tsx`
  - cards OT em atraso, lead time médio, por estado, técnico top

---

## Ordem de execução sugerida (sprints)

### Sprint 1 (base de execução) ✅
1. EPIC A (planeamento)
2. EPIC B1 (checklist + logs)

### Sprint 2 (controlo operacional) ✅
3. EPIC B2 (tempos)
4. EPIC C1 (materiais + reserva)

### Sprint 3 (fecho e gestão) ✅
5. EPIC D (fecho + documentos)
6. EPIC E (KPIs)

---

## Riscos e mitigação

- **Risco:** quebrar fluxo atual de Fase 1
  **Mitigação:** feature flags/condicionais no frontend + campos opcionais no backend

- **Risco:** inconsistência no stock durante consumo
  **Mitigação:** transações no backend ao fechar OT (`prisma.$transaction`)

- **Risco:** excesso de campos na OT
  **Mitigação:** UI por tabs e wizard de fecho

---

## Definição de pronto (DoD) por entrega

- [x] migração Prisma aplicada
- [x] endpoints com validação de input
- [x] ecrãs com estados de loading/erro/sucesso
- [x] logs/auditoria de ações críticas
- [x] build de produção sem erros (`npm run build`)

**Evidência de validação**
- Data: 2026-03-28
- Comando: `npm run build` (root: `c:\Users\julio\Desktop\APLICACAO MASTER\oreyazores26`)
- Resultado: build concluído com sucesso (geração de páginas finalizada, sem erros de compilação reportados)

---

## Sign-off Fase 2

- Estado da entrega: **Aprovada para operação**
- Data de fecho: **2026-03-28**
- Versão/escopo: **Fase 2 OT (EPIC A–E)**
- Evidências anexas: backlog atualizado + build de produção validado
- Próximo marco recomendado: **Planeamento da Fase 3 (hardening operacional e automação de testes smoke)**
