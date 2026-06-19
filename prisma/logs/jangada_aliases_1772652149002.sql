CREATE TABLE IF NOT EXISTS "JangadaAlias" (
  id SERIAL PRIMARY KEY,
  "jangadaId" INT REFERENCES "Jangada"(id) ON DELETE CASCADE,
  alias TEXT UNIQUE,
  "createdAt" TIMESTAMP DEFAULT now()
);

