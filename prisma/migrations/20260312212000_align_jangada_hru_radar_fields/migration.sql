ALTER TABLE "public"."Jangada"
ADD COLUMN IF NOT EXISTS "launchType" TEXT;

ALTER TABLE "public"."Jangada"
ADD COLUMN IF NOT EXISTS "radarReflector" TEXT;

ALTER TABLE "public"."Jangada"
ADD COLUMN IF NOT EXISTS "radarReflectorValidade" TEXT;
