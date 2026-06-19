# SOP — Estação de Serviço (Jangadas)

**Versão:** 1.0  
**Data:** 2026-03-25  
**Objetivo:** Garantir um fluxo simples, realista e auditável desde a receção até à finalização.

---

## 1) Fluxo oficial (obrigatório)

1. **Receção / Aguardar inspeção**
2. **Agendada**
3. **Em inspeção**
4. **A secar** *(quando aplicável)*
5. **Finalizada**

> **Regra principal:** não são permitidos saltos de etapa.

---

## 2) Regras de transição

### Permitido
- Avançar **apenas 1 passo**.
- Recuar **apenas 1 passo** para correção operacional.

### Não permitido
- Saltos diretos (ex.: Aguardar → Finalizada).
- Finalizar sem passar por inspeção.

### Exceções (apenas responsável/Admin)
- **Cancelar** com motivo obrigatório.
- **Reabrir** com motivo obrigatório e registo no histórico.

---

## 3) Definição de cada etapa

### Aguardar inspeção
- Jangada foi rececionada.
- Dados mínimos: serial, navio/cliente, data de receção.

### Agendada
- Há técnico atribuído e planeamento definido.
- Recomendado: data/hora prevista.

### Em inspeção
- Trabalho técnico iniciado.
- Deve existir técnico responsável.

### A secar
- Aplicável quando há necessidade operacional de secagem.
- Sem intervenção crítica em paralelo.

### Finalizada
- Inspeção concluída.
- Dados de fecho registados e prontos para documentação/agenda.

---

## 4) Campos mínimos por etapa

- **Receção/Aguardar:** serial, data de chegada.
- **Agendada:** técnico, data prevista.
- **Em inspeção:** técnico confirmado, início registado.
- **A secar:** marcação de etapa.
- **Finalizada:** fim registado, observação de fecho (se necessário).

---

## 5) Papéis e responsabilidade

- **Receção:** coloca em “Aguardar inspeção”.
- **Planeamento:** muda para “Agendada”.
- **Técnico:** muda para “Em inspeção” e “A secar” (quando aplicável).
- **Responsável de estação:** valida “Finalizada”.
- **Admin:** apenas para exceções (cancelar/reabrir).

---

## 6) Regras de ouro

1. **Editar ficha da jangada não altera estado da estação.**
2. Estado operacional só muda no módulo da estação.
3. Cada mudança deve ficar rastreável (quem, quando, de→para).

---

## 7) KPI semanal (simples)

- Total em **Aguardar**.
- Tempo médio por etapa.
- Finalizadas por semana.
- Casos bloqueados (> X dias na mesma etapa).

---

## 8) Rotina diária (check rápido)

### Início do dia
- Ver “Aguardar inspeção”.
- Priorizar por antiguidade e criticidade.

### Meio do dia
- Confirmar que “Agendada” tem técnico atribuído.
- Validar progresso das “Em inspeção”.

### Fim do dia
- Fechar as possíveis “Finalizadas”.
- Rever bloqueios em “A secar”.

---

## 9) Mensagens padrão para equipa

- “Rececionada e colocada em Aguardar inspeção.”
- “Agendada com técnico X para hoje.”
- “Inspeção iniciada às HH:MM.”
- “Passou para A secar.”
- “Finalizada e pronta para fecho documental.”

---

## 10) Critério de sucesso

O SOP está a funcionar quando:
- A equipa consegue explicar o fluxo em 30 segundos.
- Não existem saltos de estado.
- O quadro da estação reflete o estado real da oficina.
- As transições são consistentes entre operação, OT e histórico.

---

## 11) Tabela prática — Coletes (aprovação legal e inspeção)

> **Âmbito:** tabela operacional para validação documental em oficina.  
> **Nota:** em caso de conflito, prevalece sempre o texto legal em vigor e as instruções do fabricante/autoridade de bandeira.

| Tipo de operação | Critério legal de aprovação (Portugal/UE) | Periodicidade e evidência documental mínima |
| --- | --- | --- |
| **Navio comercial (bandeira UE/PT)** | Coletes no âmbito de **Equipamento Marítimo (MED)**, conformes com instrumentos internacionais aplicáveis, com **marca da roda do leme (Wheelmark)** e documentação de conformidade. | **Inspeção/manutenção por estação autorizada** segundo manual aplicável (prática operacional: **12 meses** para insufláveis, salvo regra específica superior). Guardar: registo de manutenção, identificação do técnico/estação, peças substituídas, data próxima intervenção. |
| **Embarcação de recreio / uso geral como EPI** | Coletes no âmbito de **EPI**, com **marcação CE** válida, declaração UE de conformidade e instruções do fabricante. | Seguir periodicidade do fabricante (insufláveis: normalmente anual). Guardar: declaração de conformidade, manual, prova de inspeção/revisão, histórico de componentes críticos (cápsula/CO₂/luz). |
| **Coletes insufláveis em frota profissional** | Além da aprovação base (Wheelmark ou CE, conforme contexto), validar compatibilidade com o risco e com o manual do modelo. | Criar plano anual da frota (mês de vencimento por série), com bloqueio de uso quando expirado. Evidência: etiqueta/folha de serviço com data, entidade executante, estado final (apto/não apto). |
| **Receção de colete para revisão em oficina** | Só aceitar para certificação/revisão formal quando o modelo estiver dentro do escopo técnico autorizado da estação e com peças homologadas. | Checklist obrigatório de entrada e saída. Evidência: nº série, marca/modelo, mecanismo, lote/refs de consumíveis, teste funcional e assinatura técnica. |
| **Substituição de componentes (cápsula/garrafa/luz)** | Componentes devem ser compatíveis com o modelo e com referência prevista em manual/catálogo técnico aplicável. | Registar sempre referência aplicada, validade e lote (quando aplicável), com rastreabilidade ao artigo de stock e OT de intervenção. |

### Referenciais legais de base (resumo)

- **Equipamento Marítimo (navios UE):** Diretiva 2014/90/UE (MED) e atos de execução aplicáveis.
- **Equipamento de Proteção Individual (uso geral):** Regulamento (UE) 2016/425 (aplicação direta em Portugal).
- **Exploração e procedimentos internos:** seguir orientações da autoridade marítima nacional e manuais de serviço dos fabricantes.

---

## 12) Anexo imprimível (auditoria A4)

- Utilizar o ficheiro: `documentacao/CHECKLIST_AUDITORIA_COLETES_A4.md`
- Finalidade: auditoria rápida de conformidade legal + técnica, com rastreabilidade de peças, assinaturas e carimbo.
- Regra de arquivo: anexar a checklist assinada à OT e manter cópia digital no dossier da inspeção.
