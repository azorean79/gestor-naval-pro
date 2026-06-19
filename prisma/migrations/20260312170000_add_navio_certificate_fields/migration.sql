ALTER TABLE "public"."Navio"
  ADD COLUMN IF NOT EXISTS "hruReferencia" TEXT,
  ADD COLUMN IF NOT EXISTS "hruValidade" TEXT,
  ADD COLUMN IF NOT EXISTS "radarReflector" TEXT,
  ADD COLUMN IF NOT EXISTS "radarReflectorValidade" TEXT;