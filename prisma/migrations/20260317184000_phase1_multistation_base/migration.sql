CREATE TYPE "ServiceStationTerritoryType" AS ENUM ('AZORES', 'MAINLAND', 'MADEIRA');

CREATE TYPE "MainlandRegion" AS ENUM ('NORTE', 'CENTRO', 'SUL', 'MADEIRA');

CREATE TABLE "ServiceStation" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "localizacao" TEXT,
    "territorioTipo" "ServiceStationTerritoryType" NOT NULL DEFAULT 'MAINLAND',
    "regiaoOperacional" "MainlandRegion",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceStation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceStation_codigo_key" ON "ServiceStation"("codigo");
CREATE INDEX "ServiceStation_ativo_idx" ON "ServiceStation"("ativo");
CREATE INDEX "ServiceStation_territorioTipo_idx" ON "ServiceStation"("territorioTipo");
CREATE INDEX "ServiceStation_regiaoOperacional_idx" ON "ServiceStation"("regiaoOperacional");
CREATE INDEX "ServiceStation_nome_idx" ON "ServiceStation"("nome");

ALTER TABLE "Cliente" ADD COLUMN "serviceStationId" INTEGER;
ALTER TABLE "Navio" ADD COLUMN "serviceStationId" INTEGER;
ALTER TABLE "Navio" ADD COLUMN "territorioGrupo" TEXT;
ALTER TABLE "Jangada" ADD COLUMN "serviceStationId" INTEGER;
ALTER TABLE "OrdemServico" ADD COLUMN "serviceStationId" INTEGER;
ALTER TABLE "Tecnico" ADD COLUMN "serviceStationId" INTEGER;
ALTER TABLE "ServiceStationQueue" ADD COLUMN "serviceStationId" INTEGER;

CREATE INDEX "Cliente_serviceStationId_idx" ON "Cliente"("serviceStationId");
CREATE INDEX "Navio_serviceStationId_idx" ON "Navio"("serviceStationId");
CREATE INDEX "Navio_territorioGrupo_idx" ON "Navio"("territorioGrupo");
CREATE INDEX "Jangada_serviceStationId_idx" ON "Jangada"("serviceStationId");
CREATE INDEX "OrdemServico_serviceStationId_idx" ON "OrdemServico"("serviceStationId");
CREATE INDEX "Tecnico_serviceStationId_idx" ON "Tecnico"("serviceStationId");
CREATE INDEX "ServiceStationQueue_serviceStationId_idx" ON "ServiceStationQueue"("serviceStationId");

ALTER TABLE "Cliente"
ADD CONSTRAINT "Cliente_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Navio"
ADD CONSTRAINT "Navio_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Jangada"
ADD CONSTRAINT "Jangada_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrdemServico"
ADD CONSTRAINT "OrdemServico_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tecnico"
ADD CONSTRAINT "Tecnico_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceStationQueue"
ADD CONSTRAINT "ServiceStationQueue_serviceStationId_fkey"
FOREIGN KEY ("serviceStationId") REFERENCES "ServiceStation"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
