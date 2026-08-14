CREATE TABLE IF NOT EXISTS "public"."Epirb" (
  "id" SERIAL NOT NULL,
  "shipId" INTEGER,
  "serial" TEXT NOT NULL,
  "marca" TEXT,
  "modelo" TEXT,
  "tipo" TEXT,
  "hexId" TEXT,
  "estado" TEXT NOT NULL DEFAULT 'Ativo',
  "dataInspecao" TEXT,
  "dataProxInspecao" TEXT,
  "dataValidadeBateria" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Epirb_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Epirb_serial_key" ON "public"."Epirb"("serial");
CREATE INDEX IF NOT EXISTS "Epirb_shipId_idx" ON "public"."Epirb"("shipId");
CREATE INDEX IF NOT EXISTS "Epirb_estado_idx" ON "public"."Epirb"("estado");
CREATE INDEX IF NOT EXISTS "Epirb_tipo_idx" ON "public"."Epirb"("tipo");
