UPDATE "public"."Jangada" AS j
SET
  "hruReferencia" = COALESCE(NULLIF(j."hruReferencia", ''), n."hruReferencia"),
  "hruValidade" = COALESCE(NULLIF(j."hruValidade", ''), n."hruValidade"),
  "radarReflector" = COALESCE(NULLIF(j."radarReflector", ''), n."radarReflector"),
  "radarReflectorValidade" = COALESCE(NULLIF(j."radarReflectorValidade", ''), n."radarReflectorValidade")
FROM "public"."Navio" AS n
WHERE j."shipId" = n."id"
  AND (
    (COALESCE(NULLIF(j."hruReferencia", ''), '') = '' AND COALESCE(NULLIF(n."hruReferencia", ''), '') <> '')
    OR (COALESCE(NULLIF(j."hruValidade", ''), '') = '' AND COALESCE(NULLIF(n."hruValidade", ''), '') <> '')
    OR (COALESCE(NULLIF(j."radarReflector", ''), '') = '' AND COALESCE(NULLIF(n."radarReflector", ''), '') <> '')
    OR (COALESCE(NULLIF(j."radarReflectorValidade", ''), '') = '' AND COALESCE(NULLIF(n."radarReflectorValidade", ''), '') <> '')
  );
