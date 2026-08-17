ALTER TABLE "OrdemServico" ADD COLUMN "pedidoAssistenciaId" INTEGER REFERENCES "PedidoAssistencia"("id") ON DELETE SET NULL;
CREATE INDEX "OrdemServico_pedidoAssistenciaId_idx" ON "OrdemServico"("pedidoAssistenciaId");
