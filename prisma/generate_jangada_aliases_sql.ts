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

  const parsed = JSON.parse(fs.readFileSync(path.join(logsDir, fuzzyFile), "utf8"));
  const results: Array<any> = parsed.results || [];

  const accepted: Array<any> = [];

  for (const r of results) {
    const score = typeof r.score === "number" ? r.score : 0;
    if (score < 0.6) continue;

    // fetch certificado raftSerial
    const certRows: any[] = await prisma.$queryRaw`
      SELECT "id", "raftSerial", "fileName" FROM "CertificadoExtraido" WHERE id = ${r.id}`;

    if (!certRows || certRows.length === 0) continue;
    const raftSerial = certRows[0].raftSerial;
    const fileName = certRows[0].fileName;

    if (!raftSerial) continue;

    // find jangada by matchedSerial (exact)
    let jangadaRows: any[] = await prisma.$queryRaw`
      SELECT id, serial FROM "Jangada" WHERE serial = ${r.matchedSerial} LIMIT 1`;

    // if no exact match, try normalized lookup (remove non-alphanumerics, case-insensitive)
    if (!jangadaRows || jangadaRows.length === 0) {
      const norm = String(r.matchedSerial).replace(/[^A-Za-z0-9]/g, "").toLowerCase();
      jangadaRows = await prisma.$queryRaw`
        SELECT id, serial FROM "Jangada" WHERE lower(regexp_replace(serial, '[^A-Za-z0-9]', '', 'g')) = ${norm} LIMIT 1`;
    }

    if (!jangadaRows || jangadaRows.length === 0) continue;

    const jangada = jangadaRows[0];
    if (raftSerial === jangada.serial) continue;

    accepted.push({
      certificadoId: r.id,
      fileName,
      raftSerial,
      matchedSerial: r.matchedSerial,
      jangadaId: jangada.id,
      score: r.score,
    });
  }

  const ts = Date.now();
  const sqlPath = path.join(logsDir, `jangada_aliases_${ts}.sql`);
  const jsonPath = path.join(logsDir, `jangada_aliases_${ts}.json`);

  const createTable = `CREATE TABLE IF NOT EXISTS "JangadaAlias" (
  id SERIAL PRIMARY KEY,
  "jangadaId" INT REFERENCES "Jangada"(id) ON DELETE CASCADE,
  alias TEXT UNIQUE,
  "createdAt" TIMESTAMP DEFAULT now()
);
`;

  const inserts = accepted
    .map(
      (a) =>
        `INSERT INTO "JangadaAlias" ("jangadaId", alias) VALUES (${a.jangadaId}, '${a.raftSerial.replace("'", "''")}') ON CONFLICT (alias) DO NOTHING; -- score=${a.score} certificadoId=${a.certificadoId} file=${a.fileName}`
    )
    .join("\n");

  fs.writeFileSync(sqlPath, createTable + "\n" + inserts, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: accepted.length, accepted }, null, 2), "utf8");

  console.log(`Wrote SQL -> ${sqlPath}`);
  console.log(`Wrote JSON -> ${jsonPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
