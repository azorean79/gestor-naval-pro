ALTER TABLE "Stock"
ADD COLUMN "testeHidraulico" TEXT,
ADD COLUMN "estadoCargaCilindro" TEXT;

CREATE INDEX "Stock_estadoCargaCilindro_idx" ON "Stock"("estadoCargaCilindro");