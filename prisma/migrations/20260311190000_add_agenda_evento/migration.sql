-- Create dedicated operational agenda events table
CREATE TABLE IF NOT EXISTS "AgendaEvento" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "raftSerial" TEXT NOT NULL,
  "responsavel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "type" TEXT NOT NULL DEFAULT 'Inspeção',
  "inspectionType" TEXT NOT NULL DEFAULT 'outro',
  "durationMinutes" INTEGER NOT NULL DEFAULT 210,
  "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 15,
  "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 15,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AgendaEvento_raftSerial_idx" ON "AgendaEvento"("raftSerial");
CREATE INDEX IF NOT EXISTS "AgendaEvento_date_idx" ON "AgendaEvento"("date");
CREATE INDEX IF NOT EXISTS "AgendaEvento_status_idx" ON "AgendaEvento"("status");
CREATE INDEX IF NOT EXISTS "AgendaEvento_responsavel_date_idx" ON "AgendaEvento"("responsavel", "date");
