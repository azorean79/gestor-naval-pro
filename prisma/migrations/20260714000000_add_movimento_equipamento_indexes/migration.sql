-- CreateIndex
CREATE INDEX "MovimentoEquipamento_equipamentoId_idx" ON "MovimentoEquipamento"("equipamentoId");

-- CreateIndex
CREATE INDEX "MovimentoEquipamento_data_idx" ON "MovimentoEquipamento"("data");

-- CreateIndex
CREATE INDEX "MovimentoEquipamento_tipoEquipamento_equipamentoId_idx" ON "MovimentoEquipamento"("tipoEquipamento", "equipamentoId");
