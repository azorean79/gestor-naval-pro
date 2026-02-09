-- Adiciona campos para controle de jangadas na estação de serviço
ALTER TABLE "jangadas" 
ADD "dataEntradaEstacao" TIMESTAMP;
ALTER TABLE "jangadas" 
ADD "dataPrevistaEntrega" TIMESTAMP;

-- Atualiza comentário do campo estado
COMMENT ON COLUMN "jangadas"."estado" IS 'instalada, removida, em_estacao, etc.';
