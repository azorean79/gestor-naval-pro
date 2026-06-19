const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function exec(sql) {
  await prisma.$executeRawUnsafe(sql);
}

async function main() {
  const statements = [
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "numeroCliente" TEXT NULL;`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "nif" TEXT NULL;`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "email" TEXT NULL;`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "telefone" TEXT NULL;`,
    `ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "telmovel" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "categoria" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "associavelJangada" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "aplicavelMarcaJangada" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "aplicavelModeloJangada" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "precoCompra" DOUBLE PRECISION NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "codigoFabricante" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "inventario" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "lote" TEXT NULL;`,
    `ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "validade" TEXT NULL;`,
    `UPDATE "Jangada" SET "model" = 'COASTAL' WHERE UPPER(TRIM("model")) = 'COASTER';`,
    `ALTER TABLE "Jangada" ADD COLUMN IF NOT EXISTS "certificadoAtivoId" INTEGER NULL;`,

    `CREATE TABLE IF NOT EXISTS "CertificadoExtraido" (
      "id" SERIAL PRIMARY KEY,
      "fileName" TEXT NOT NULL,
      "certificadoNumero" TEXT NULL,
      "sourceYear" INTEGER NOT NULL DEFAULT 2025,
      "raftSerial" TEXT NULL,
      "shipName" TEXT NULL,
      "dataInspecao" TEXT NULL,
      "dataProxInspecao" TEXT NULL,
      "emergencyPackType" TEXT NULL,
      "hasQuadro" BOOLEAN NOT NULL DEFAULT false,
      "validitiesCount" INTEGER NOT NULL DEFAULT 0,
      "isMaisRecente" BOOLEAN NOT NULL DEFAULT false,
      "aplicadoComoAtivo" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "CertificadoValidade" (
      "id" SERIAL PRIMARY KEY,
      "certificadoId" INTEGER NOT NULL,
      "item" TEXT NOT NULL,
      "validade" TEXT NOT NULL,
      "rowNumber" INTEGER NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "Inspecao" (
      "id" SERIAL PRIMARY KEY,
      "certificadoNumero" TEXT NOT NULL,
      "navioNome" TEXT NOT NULL,
      "navioId" INTEGER NULL,
      "jangadaId" INTEGER NULL,
      "jangadaSerial" TEXT NULL,
      "dataInspecao" TEXT NOT NULL,
      "dataProxInspecao" TEXT NULL,
      "status" TEXT NOT NULL DEFAULT 'Concluída',
      "sourceFile" TEXT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "InspecaoArtigo" (
      "id" SERIAL PRIMARY KEY,
      "inspecaoId" INTEGER NOT NULL,
      "stockId" INTEGER NOT NULL,
      "referencia" TEXT NOT NULL,
      "descricao" TEXT NOT NULL,
      "quantidadePlaneada" INTEGER NOT NULL DEFAULT 1,
      "quantidadeUsada" INTEGER NOT NULL DEFAULT 0,
      "estado" TEXT NOT NULL DEFAULT 'Pendente',
      "observacoes" TEXT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `ALTER TABLE "CertificadoExtraido" ADD COLUMN IF NOT EXISTS "certificadoNumero" TEXT NULL;`,
    `ALTER TABLE "CertificadoExtraido" ADD COLUMN IF NOT EXISTS "dataInspecao" TEXT NULL;`,
    `ALTER TABLE "CertificadoExtraido" ADD COLUMN IF NOT EXISTS "dataProxInspecao" TEXT NULL;`,
    `ALTER TABLE "CertificadoExtraido" ADD COLUMN IF NOT EXISTS "isMaisRecente" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "CertificadoExtraido" ADD COLUMN IF NOT EXISTS "aplicadoComoAtivo" BOOLEAN NOT NULL DEFAULT false;`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_numeroCliente_key" ON "Cliente" ("numeroCliente");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CertificadoExtraido_fileName_key" ON "CertificadoExtraido" ("fileName");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "CertificadoValidade_unique_idx" ON "CertificadoValidade" ("certificadoId", "item", "validade", "rowNumber");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Inspecao_certificadoNumero_key" ON "Inspecao" ("certificadoNumero");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "InspecaoArtigo_inspecaoId_stockId_key" ON "InspecaoArtigo" ("inspecaoId", "stockId");`,

    `CREATE INDEX IF NOT EXISTS "CertificadoExtraido_raftSerial_idx" ON "CertificadoExtraido" ("raftSerial");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoExtraido_shipName_idx" ON "CertificadoExtraido" ("shipName");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoExtraido_dataInspecao_idx" ON "CertificadoExtraido" ("dataInspecao");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoExtraido_isMaisRecente_idx" ON "CertificadoExtraido" ("isMaisRecente");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoValidade_certificadoId_idx" ON "CertificadoValidade" ("certificadoId");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoValidade_item_idx" ON "CertificadoValidade" ("item");`,
    `CREATE INDEX IF NOT EXISTS "CertificadoValidade_validade_idx" ON "CertificadoValidade" ("validade");`,
    `CREATE INDEX IF NOT EXISTS "Stock_categoria_idx" ON "Stock" ("categoria");`,
    `CREATE INDEX IF NOT EXISTS "Stock_associavelJangada_idx" ON "Stock" ("associavelJangada");`,
    `CREATE INDEX IF NOT EXISTS "Stock_aplicavelMarcaJangada_idx" ON "Stock" ("aplicavelMarcaJangada");`,
    `CREATE INDEX IF NOT EXISTS "Stock_aplicavelModeloJangada_idx" ON "Stock" ("aplicavelModeloJangada");`,
    `CREATE INDEX IF NOT EXISTS "Jangada_certificadoAtivoId_idx" ON "Jangada" ("certificadoAtivoId");`,
    `CREATE INDEX IF NOT EXISTS "Inspecao_navioNome_idx" ON "Inspecao" ("navioNome");`,
    `CREATE INDEX IF NOT EXISTS "Inspecao_navioId_idx" ON "Inspecao" ("navioId");`,
    `CREATE INDEX IF NOT EXISTS "Inspecao_jangadaId_idx" ON "Inspecao" ("jangadaId");`,
    `CREATE INDEX IF NOT EXISTS "Inspecao_jangadaSerial_idx" ON "Inspecao" ("jangadaSerial");`,
    `CREATE INDEX IF NOT EXISTS "Inspecao_dataInspecao_idx" ON "Inspecao" ("dataInspecao");`,
    `CREATE INDEX IF NOT EXISTS "InspecaoArtigo_inspecaoId_idx" ON "InspecaoArtigo" ("inspecaoId");`,
    `CREATE INDEX IF NOT EXISTS "InspecaoArtigo_stockId_idx" ON "InspecaoArtigo" ("stockId");`,
    `CREATE INDEX IF NOT EXISTS "InspecaoArtigo_estado_idx" ON "InspecaoArtigo" ("estado");`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CertificadoExtraido_raftSerial_fkey'
      ) THEN
        ALTER TABLE "CertificadoExtraido"
        ADD CONSTRAINT "CertificadoExtraido_raftSerial_fkey"
        FOREIGN KEY ("raftSerial") REFERENCES "Jangada"("serial") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END$$;`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CertificadoValidade_certificadoId_fkey'
      ) THEN
        ALTER TABLE "CertificadoValidade"
        ADD CONSTRAINT "CertificadoValidade_certificadoId_fkey"
        FOREIGN KEY ("certificadoId") REFERENCES "CertificadoExtraido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END$$;`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Jangada_certificadoAtivoId_fkey'
      ) THEN
        ALTER TABLE "Jangada"
        ADD CONSTRAINT "Jangada_certificadoAtivoId_fkey"
        FOREIGN KEY ("certificadoAtivoId") REFERENCES "CertificadoExtraido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END$$;`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Inspecao_jangadaId_fkey'
      ) THEN
        ALTER TABLE "Inspecao"
        ADD CONSTRAINT "Inspecao_jangadaId_fkey"
        FOREIGN KEY ("jangadaId") REFERENCES "Jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END$$;`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InspecaoArtigo_inspecaoId_fkey'
      ) THEN
        ALTER TABLE "InspecaoArtigo"
        ADD CONSTRAINT "InspecaoArtigo_inspecaoId_fkey"
        FOREIGN KEY ("inspecaoId") REFERENCES "Inspecao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END$$;`,

    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'InspecaoArtigo_stockId_fkey'
      ) THEN
        ALTER TABLE "InspecaoArtigo"
        ADD CONSTRAINT "InspecaoArtigo_stockId_fkey"
        FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END$$;`,
  ];

  for (const sql of statements) {
    await exec(sql);
  }

  console.log('Alinhamento de schema aplicado com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro ao aplicar alinhamento de schema:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
