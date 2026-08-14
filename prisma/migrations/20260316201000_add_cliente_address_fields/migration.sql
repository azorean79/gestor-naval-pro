-- Add customer address complement fields for door number and postal code.
ALTER TABLE "Cliente"
ADD COLUMN "moradaNumero" TEXT,
ADD COLUMN "codigoPostal" TEXT;

CREATE INDEX "Cliente_codigoPostal_idx" ON "Cliente"("codigoPostal");