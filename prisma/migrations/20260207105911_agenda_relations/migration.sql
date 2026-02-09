-- DropForeignKey
ALTER TABLE "inspecao_componentes" DROP CONSTRAINT "inspecao_componentes_jangadaId_fkey";

-- AlterTable
ALTER TABLE "certificados" ADD COLUMN     "agendamentoId" TEXT;

-- AlterTable
ALTER TABLE "inspecao_componentes" ADD COLUMN     "agendamentoId" TEXT,
ADD COLUMN     "codigoFabricante" TEXT,
ADD COLUMN     "referenciaOrey" TEXT;

-- AlterTable
ALTER TABLE "inspecoes" ADD COLUMN     "agendamentoId" TEXT,
ADD COLUMN     "obraId" TEXT;

-- AlterTable
ALTER TABLE "jangadas" ADD COLUMN     "cilindroId" TEXT,
ALTER COLUMN "dataEntradaEstacao" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "dataPrevistaEntrega" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "obras" ADD COLUMN     "navioId" TEXT;

-- AlterTable
ALTER TABLE "stock" ADD COLUMN     "codigoBarra" TEXT,
ADD COLUMN     "dataValidade" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "camaras_jangada" (
    "id" TEXT NOT NULL,
    "jangadaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valvulaId" TEXT,
    "nomeValvula" TEXT NOT NULL,
    "sistemaSufacao" TEXT,
    "dataInstalacao" TIMESTAMP(3),
    "proximoTeste" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ok',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camaras_jangada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "componentes_pack" (
    "id" TEXT NOT NULL,
    "jangadaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'ok',
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "dataInstalacao" TIMESTAMP(3),
    "proximaInspecao" TIMESTAMP(3),
    "observacoes" TEXT,
    "agendamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "componentes_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "componentes_stock" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "inspecaoComponenteId" TEXT,
    "componentePackId" TEXT,
    "inspecaoId" TEXT,
    "certificadoId" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "componentes_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_inspecao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "ferramentaNecessaria" TEXT,
    "criterioAprovacao" TEXT,
    "referenciaManual" TEXT,
    "aplicavelMarcaId" TEXT,
    "aplicavelModeloId" TEXT,
    "aplicavelLotacaoId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificacao_checklist_inspecao" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "inspecaoId" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "aprovado" BOOLEAN,
    "valor" TEXT,
    "observacoes" TEXT,
    "responsavel" TEXT,
    "dataVerificacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verificacao_checklist_inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "camaras_jangada_jangadaId_tipo_key" ON "camaras_jangada"("jangadaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "verificacao_checklist_inspecao_checklistItemId_inspecaoId_key" ON "verificacao_checklist_inspecao"("checklistItemId", "inspecaoId");

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camaras_jangada" ADD CONSTRAINT "camaras_jangada_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camaras_jangada" ADD CONSTRAINT "camaras_jangada_valvulaId_fkey" FOREIGN KEY ("valvulaId") REFERENCES "tipos_valvula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao_componentes" ADD CONSTRAINT "inspecao_componentes_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao_componentes" ADD CONSTRAINT "inspecao_componentes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_pack" ADD CONSTRAINT "componentes_pack_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_pack" ADD CONSTRAINT "componentes_pack_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_stock" ADD CONSTRAINT "componentes_stock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_stock" ADD CONSTRAINT "componentes_stock_inspecaoComponenteId_fkey" FOREIGN KEY ("inspecaoComponenteId") REFERENCES "inspecao_componentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_stock" ADD CONSTRAINT "componentes_stock_componentePackId_fkey" FOREIGN KEY ("componentePackId") REFERENCES "componentes_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_stock" ADD CONSTRAINT "componentes_stock_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_stock" ADD CONSTRAINT "componentes_stock_certificadoId_fkey" FOREIGN KEY ("certificadoId") REFERENCES "certificados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_inspecao" ADD CONSTRAINT "checklist_inspecao_aplicavelMarcaId_fkey" FOREIGN KEY ("aplicavelMarcaId") REFERENCES "marcas_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_inspecao" ADD CONSTRAINT "checklist_inspecao_aplicavelModeloId_fkey" FOREIGN KEY ("aplicavelModeloId") REFERENCES "modelos_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_inspecao" ADD CONSTRAINT "checklist_inspecao_aplicavelLotacaoId_fkey" FOREIGN KEY ("aplicavelLotacaoId") REFERENCES "lotacoes_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificacao_checklist_inspecao" ADD CONSTRAINT "verificacao_checklist_inspecao_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "checklist_inspecao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificacao_checklist_inspecao" ADD CONSTRAINT "verificacao_checklist_inspecao_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
