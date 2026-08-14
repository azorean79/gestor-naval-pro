ALTER TABLE "Cliente"
ADD COLUMN "localidade" TEXT;

CREATE INDEX "Cliente_localidade_idx" ON "Cliente"("localidade");