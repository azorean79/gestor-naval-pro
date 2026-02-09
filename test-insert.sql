-- Teste de inserção de jangada
INSERT INTO "jangadas" (
  "id",
  "numeroSerie",
  "tipo",
  "status",
  "estado",
  "tecnico",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'TEST-001',
  'inflável',
  'ativo',
  'instalada',
  'Julio Correia',
  NOW(),
  NOW()
);