ALTER TABLE "public"."Navio"
ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "Navio_lat_idx" ON "public"."Navio"("lat");
CREATE INDEX IF NOT EXISTS "Navio_lng_idx" ON "public"."Navio"("lng");
