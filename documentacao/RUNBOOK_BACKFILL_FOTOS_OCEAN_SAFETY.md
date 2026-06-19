# Runbook — Backfill de Fotos Ocean Safety (Produção)

Data: 2026-03-28

## Objetivo

Preencher/corrigir o campo `stock.foto` para artigos Ocean Safety (ex.: `OSL9507`) na BD de produção (Vercel/Supabase).

## Comando único (recomendado)

Executar:

`npm run doctor:stock:ocean-safety:foto -- OSL9507`

Este comando faz automaticamente:
1. verificação inicial da referência;
2. backfill (se necessário);
3. verificação final.

## Pré-requisitos

- `DATABASE_URL` apontada para a BD de produção
- Repositório atualizado com:
  - `scripts/backfill_ocean_safety_images.cjs`
  - `scripts/verify_stock_photo_ref.cjs`
  - `documentacao/ocean_safety_image_map.json`

## Passo 1 — Verificar estado atual (read-only)

Executar:

`node scripts/verify_stock_photo_ref.cjs OSL9507`

Esperado antes do backfill (problema atual):
- `foto: NULL` ou valor incorreto

## Passo 2 — Executar backfill

Executar:

`npm run backfill:stock:ocean-safety:fotos`

Resultado esperado:
- resumo com quantidade de itens atualizados
- linha de verificação para `OSL9507`

## Passo 3 — Verificar novamente

Executar:

`node scripts/verify_stock_photo_ref.cjs OSL9507`

Esperado após backfill:
- `foto: /ocean-safety-spares/OSL9507.jpeg`

## Passo 4 — Validação no endpoint

Chamar:

`/api/stock?refs=OSL9507&includeFoto=true`

Esperado:
- item com campo `foto` preenchido

## Rollback simples

Se precisares reverter apenas o artigo:
- update manual da coluna `foto` para `NULL` (ou valor anterior) no registo da referência.

## Notas

- O backfill atualiza apenas refs existentes na tabela `stock`.
- Se uma referência não existir na BD, ela aparecerá no resumo como "não encontrada".
