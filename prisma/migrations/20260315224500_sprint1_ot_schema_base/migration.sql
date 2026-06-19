-- Sprint 1 OT base schema: técnico, checklist, tempos e logs

CREATE TABLE IF NOT EXISTS "Tecnico" (
  "id" SERIAL NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tecnico_email_key" ON "Tecnico"("email");
CREATE INDEX IF NOT EXISTS "Tecnico_nome_idx" ON "Tecnico"("nome");
CREATE INDEX IF NOT EXISTS "Tecnico_ativo_idx" ON "Tecnico"("ativo");

ALTER TABLE "OrdemServico"
ADD COLUMN IF NOT EXISTS "tecnicoId" INTEGER;

CREATE INDEX IF NOT EXISTS "OrdemServico_tecnicoId_idx" ON "OrdemServico"("tecnicoId");

DO $$
BEGIN
  ALTER TABLE "OrdemServico"
  ADD CONSTRAINT "OrdemServico_tecnicoId_fkey"
  FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrdemServicoChecklistItem" (
  "id" SERIAL NOT NULL,
  "ordemServicoId" INTEGER NOT NULL,
  "phase" TEXT NOT NULL DEFAULT 'pre',
  "label" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdemServicoChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrdemServicoChecklistItem_ordemServicoId_idx" ON "OrdemServicoChecklistItem"("ordemServicoId");
CREATE INDEX IF NOT EXISTS "OrdemServicoChecklistItem_phase_idx" ON "OrdemServicoChecklistItem"("phase");
CREATE INDEX IF NOT EXISTS "OrdemServicoChecklistItem_updatedById_idx" ON "OrdemServicoChecklistItem"("updatedById");

DO $$
BEGIN
  ALTER TABLE "OrdemServicoChecklistItem"
  ADD CONSTRAINT "OrdemServicoChecklistItem_ordemServicoId_fkey"
  FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrdemServicoChecklistItem"
  ADD CONSTRAINT "OrdemServicoChecklistItem_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrdemServicoTempo" (
  "id" SERIAL NOT NULL,
  "ordemServicoId" INTEGER NOT NULL,
  "tecnicoId" INTEGER,
  "tecnico" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdemServicoTempo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrdemServicoTempo_ordemServicoId_idx" ON "OrdemServicoTempo"("ordemServicoId");
CREATE INDEX IF NOT EXISTS "OrdemServicoTempo_tecnicoId_idx" ON "OrdemServicoTempo"("tecnicoId");
CREATE INDEX IF NOT EXISTS "OrdemServicoTempo_startedAt_idx" ON "OrdemServicoTempo"("startedAt");

DO $$
BEGIN
  ALTER TABLE "OrdemServicoTempo"
  ADD CONSTRAINT "OrdemServicoTempo_ordemServicoId_fkey"
  FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrdemServicoTempo"
  ADD CONSTRAINT "OrdemServicoTempo_tecnicoId_fkey"
  FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrdemServicoLog" (
  "id" SERIAL NOT NULL,
  "ordemServicoId" INTEGER NOT NULL,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL DEFAULT 'EVENT',
  "message" TEXT NOT NULL,
  "user" TEXT,
  "tecnicoId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdemServicoLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrdemServicoLog_ordemServicoId_idx" ON "OrdemServicoLog"("ordemServicoId");
CREATE INDEX IF NOT EXISTS "OrdemServicoLog_at_idx" ON "OrdemServicoLog"("at");
CREATE INDEX IF NOT EXISTS "OrdemServicoLog_type_idx" ON "OrdemServicoLog"("type");
CREATE INDEX IF NOT EXISTS "OrdemServicoLog_tecnicoId_idx" ON "OrdemServicoLog"("tecnicoId");

DO $$
BEGIN
  ALTER TABLE "OrdemServicoLog"
  ADD CONSTRAINT "OrdemServicoLog_ordemServicoId_fkey"
  FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrdemServicoLog"
  ADD CONSTRAINT "OrdemServicoLog_tecnicoId_fkey"
  FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
