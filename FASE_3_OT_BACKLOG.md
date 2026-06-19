# FASE 3 — Backlog Técnico (Hardening Operacional OT)

Data: 2026-03-28  
Estado: Proposta pronta para execução

---

## Objetivo da Fase 3

Consolidar a operação de OT em produção com foco em:

1. **Confiabilidade** (idempotência, concorrência e consistência)
2. **Segurança operacional** (permissões finas por ação crítica)
3. **Qualidade contínua** (smoke tests ponta-a-ponta)
4. **Observabilidade** (alertas e auditoria pesquisável)
5. **Resiliência** (backup + ensaio de recuperação)

---

## Princípios de implementação

- Zero regressão funcional da Fase 2
- Todas as ações críticas com trilha de auditoria
- Melhorias incrementais e reversíveis
- Métricas antes de otimizações

---

## EPIC F — Hardening de Ações Críticas

### F1. Idempotência e proteção contra duplo clique
**Resultado esperado:** ações críticas não geram duplicação de efeitos.

**Backend**
- [ ] `src/app/api/ordens-servico/[id]/materiais/route.ts`
  - idempotência para `consume` por chave de operação
- [ ] `src/app/api/ordens-servico/[id]/route.ts`
  - idempotência para `fechar OT`
- [ ] `src/app/api/ordens-servico/[id]/documento/route.ts`
  - proteção para geração repetida de documento (sem efeitos colaterais)

**Frontend**
- [ ] `src/app/ordens-servico/[id]/page.tsx`
  - lock de botões críticos enquanto request está pendente
  - feedback visual de operação em processamento

**Critérios de aceitação**
- [ ] chamadas duplicadas não duplicam consumo/fecho
- [ ] logs distinguem operação original vs repetida

### F2. Controlo de concorrência otimista
**Resultado esperado:** alterações simultâneas não sobrepõem dados silenciosamente.

**Backend**
- [ ] validação de versão com `updatedAt`/etag lógico em updates de OT
- [ ] resposta 409 com mensagem orientativa quando houver conflito

**Frontend**
- [ ] tratamento explícito de conflito (refresh + merge guiado)

**Critérios de aceitação**
- [ ] edição concorrente gera conflito claro, sem perda de dados

---

## EPIC G — Segurança e Permissões Operacionais

### G1. RBAC por ação crítica OT
**Resultado esperado:** apenas perfis autorizados executam operações sensíveis.

**Backend**
- [ ] regras por ação: `consumir stock`, `fechar OT`, `gerar documento`
- [ ] logs de tentativa negada com utilizador/perfil/ação

**Frontend**
- [ ] ocultar/desativar ações sem permissão
- [ ] mensagens claras de acesso negado

**Critérios de aceitação**
- [ ] utilizador sem perfil não executa ação crítica
- [ ] tentativa negada fica auditável

---

## EPIC H — Qualidade Contínua (Smoke E2E)

### H1. Cenários smoke obrigatórios
**Resultado esperado:** regressões críticas detetadas antes de deploy.

**Testes (E2E)**
- [ ] criar OT
- [ ] checklist (marcar/desmarcar)
- [ ] tempos (start/stop)
- [ ] materiais (adicionar/reservar/consumir)
- [ ] fecho da OT
- [ ] geração de documento (JSON/PDF)

**Pipeline**
- [ ] execução automática dos smoke tests em PR/merge

**Critérios de aceitação**
- [ ] build + smoke verdes para aprovação

---

## EPIC I — Observabilidade e Operação Assistida

### I1. Alertas operacionais em tempo útil
**Resultado esperado:** equipa reage cedo a desvios críticos.

**Backend**
- [ ] endpoint de alertas OT (atrasos, execução em curso prolongada, stock insuficiente)

**Frontend**
- [ ] cards/avisos no dashboard com severidade (info/atenção/crítico)
- [ ] filtros rápidos por tipo de alerta

**Critérios de aceitação**
- [ ] alertas críticos visíveis em < 5 segundos após carga do dashboard

### I2. Auditoria pesquisável
**Resultado esperado:** investigação rápida de incidentes e alterações.

**Backend**
- [ ] endpoint com filtros por OT, técnico, tipo de evento e intervalo temporal

**Frontend**
- [ ] página/aba de auditoria com pesquisa e exportação simples

**Critérios de aceitação**
- [ ] localizar qualquer evento crítico em < 1 minuto

---

## EPIC J — Resiliência de Dados

### J1. Backup e ensaio de recuperação
**Resultado esperado:** recuperação comprovada em cenário de incidente.

**Operação**
- [ ] política de backup documentada (frequência, retenção, responsável)
- [ ] restore drill com relatório (RTO/RPO medidos)

**Critérios de aceitação**
- [ ] restauração validada com sucesso em ambiente de teste

---

## Ordem de execução sugerida (2–4 semanas)

### Sprint 1 (semana 1)
1. F1 Idempotência ações críticas
2. G1 Permissões por ação
3. H1 Estrutura base de smoke tests

### Sprint 2 (semana 2)
4. F2 Concorrência otimista
5. I1 Alertas operacionais
6. H1 Smoke tests completos + pipeline

### Sprint 3 (semana 3/4)
7. I2 Auditoria pesquisável
8. J1 Backup + restore drill

---

## Definição de pronto (DoD) da Fase 3

- [ ] ações críticas protegidas por idempotência
- [ ] permissões finas por ação implementadas
- [ ] smoke tests E2E obrigatórios no pipeline
- [ ] painel com alertas operacionais ativos
- [ ] auditoria pesquisável disponível
- [ ] restore drill executado e documentado
- [ ] build de produção sem erros (`npm run build`)

---

## Próxima ação recomendada (imediata)

Começar por **F1 + G1 + H1**:

1. Definir chave de idempotência para consumo/fecho
2. Aplicar RBAC por endpoint crítico
3. Criar 3 smoke tests mínimos (tempo, material, fecho)
