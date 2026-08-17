-- Create table for assistance requests received from Zapier Forms webhook
CREATE TABLE IF NOT EXISTS "PedidoAssistencia" (
  "id" SERIAL PRIMARY KEY,
  "serviceStationId" INTEGER,
  "nome" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "navio" TEXT,
  "jangadaSerial" TEXT,
  "tipoAssistencia" TEXT,
  "descricao" TEXT NOT NULL,
  "dataPreferida" TEXT,
  "origem" TEXT NOT NULL DEFAULT 'zapier',
  "estado" TEXT NOT NULL DEFAULT 'novo',
  "metadados" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PedidoAssistencia_jangadaSerial_idx" ON "PedidoAssistencia"("jangadaSerial");
CREATE INDEX IF NOT EXISTS "PedidoAssistencia_estado_idx" ON "PedidoAssistencia"("estado");
CREATE INDEX IF NOT EXISTS "PedidoAssistencia_serviceStationId_idx" ON "PedidoAssistencia"("serviceStationId");
