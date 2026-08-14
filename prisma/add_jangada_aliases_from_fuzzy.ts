import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logsDir = path.join(__dirname, "logs");
  const fuzzyFile = fs
    .readdirSync(logsDir)
    .find((f) => f.startsWith("reassociate_jangadas_fuzzy_") && f.endsWith(".json"));

  if (!fuzzyFile) {
    console.error("Fuzzy log not found in prisma/logs/");
    process.exit(1);
  }

  const fuzzyPath = path.join(logsDir, fuzzyFile);
  const raw = fs.readFileSync(fuzzyPath, "utf8");
  const parsed = JSON.parse(raw);

  // create alias table if missing (use raw SQL so we don't need a prisma schema migration)
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "JangadaAlias" (
      id SERIAL PRIMARY KEY,
      "jangadaId" INT REFERENCES "Jangada"(id) ON DELETE CASCADE,
      alias TEXT UNIQUE,
      "createdAt" TIMESTAMP DEFAULT now()
    )`;

  const results: Array<any> = parsed.results || [];
  const accepted: Array<any> = [];
  const skipped: Array<any> = [];

  for (const r of results) {
    const score = typeof r.score === "number" ? r.score : 0;
    if (score < 0.6) {
      skipped.push({ id: r.id, reason: "low-score", score, matchedSerial: r.matchedSerial });
      continue;
    }

    // load certificado to get original raftSerial
    const cert: any[] = await prisma.$queryRaw`
      SELECT "id", "raftSerial" FROM "CertificadoExtraido" WHERE id = ${r.id}`;

    if (!cert || cert.length === 0) {
      skipped.push({ id: r.id, reason: "cert-not-found", score, matchedSerial: r.matchedSerial });
      continue;
    }

    const raftSerial = cert[0].raftSerial;
    if (!raftSerial || raftSerial.trim() === "") {
      skipped.push({ id: r.id, reason: "no-raftSerial", score, matchedSerial: r.matchedSerial });
      continue;
    }

    const matchedSerial = r.matchedSerial;
    // find jangada by serial
    const jangadaRows: any[] = await prisma.$queryRaw`
      SELECT id, serial FROM "Jangada" WHERE serial = ${matchedSerial} LIMIT 1`;

    if (!jangadaRows || jangadaRows.length === 0) {
      skipped.push({ id: r.id, reason: "jangada-not-found", score, matchedSerial, raftSerial });
      continue;
    }

    const jangada = jangadaRows[0];
    if (raftSerial === jangada.serial) {
      skipped.push({ id: r.id, reason: "identical-to-canonical", score, matchedSerial, raftSerial });
      continue;
    }

    // insert alias (idempotent)
    try {
      await prisma.$executeRaw`
        INSERT INTO "JangadaAlias" ("jangadaId", alias) VALUES (${jangada.id}, ${raftSerial}) ON CONFLICT (alias) DO NOTHING`;
      accepted.push({ id: r.id, jangadaId: jangada.id, matchedSerial, raftSerial, score });
    } catch (err: any) {
      skipped.push({ id: r.id, reason: "insert-failed", error: String(err), score, matchedSerial, raftSerial });
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    fuzzyFile,
    acceptedCount: accepted.length,
    skippedCount: skipped.length,
    accepted,
    skipped,
  };

  const outPath = path.join(logsDir, `add_jangada_aliases_from_fuzzy_${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
