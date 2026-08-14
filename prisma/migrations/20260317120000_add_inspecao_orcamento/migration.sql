-- Persistir o orçamento da inspeção (passo 7 do wizard) na Inspecao
ALTER TABLE "public"."Inspecao" ADD COLUMN "orcamento" JSONB;
