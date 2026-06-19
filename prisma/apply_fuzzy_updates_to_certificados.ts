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

  const threshold = parseFloat(process.env.THRESHOLD ?? "0.6");
  console.log(`Using threshold=${threshold}`);
  const applied: any[] = [];
  const skipped: any[] = [];
  const sqlStmts: string[] = [];

  for (const r of results) {
    const score = typeof r.score === "number" ? r.score : 0;
    if (score < threshold) {
      skipped.push({ id: r.id, reason: "low-score", score });
      continue;
    }

    // load certificado
    const certRows: any[] = await prisma.$queryRaw`
      SELECT "id", "raftSerial", "fileName" FROM "CertificadoExtraido" WHERE id = ${r.id}`;
    if (!certRows || certRows.length === 0) {
      skipped.push({ id: r.id, reason: "cert-not-found" });
      continue;
    }

    const cert = certRows[0];
    const raftSerial = cert.raftSerial;

    // find jangada by matchedSerial (exact or normalized)
    let jangadaRows: any[] = await prisma.$queryRaw`
      SELECT id, serial FROM "Jangada" WHERE serial = ${r.matchedSerial} LIMIT 1`;
    if (!jangadaRows || jangadaRows.length === 0) {
      const norm = String(r.matchedSerial).replace(/[^A-Za-z0-9]/g, "").toLowerCase();
      jangadaRows = await prisma.$queryRaw`
        SELECT id, serial FROM "Jangada" WHERE lower(regexp_replace(serial, '[^A-Za-z0-9]', '', 'g')) = ${norm} LIMIT 1`;
    }

    if (!jangadaRows || jangadaRows.length === 0) {
      skipped.push({ id: r.id, reason: "jangada-not-found", matchedSerial: r.matchedSerial });
      continue;
    }

    const jangada = jangadaRows[0];
    if (raftSerial === jangada.serial) {
      skipped.push({ id: r.id, reason: "already-canonical", raftSerial });
      continue;
    }

    // attempt update via prisma
    try {
      await prisma.$executeRaw`
        UPDATE "CertificadoExtraido" SET "raftSerial" = ${jangada.serial}, "updatedAt" = now() WHERE id = ${r.id}`;
      applied.push({ id: r.id, from: raftSerial, to: jangada.serial, jangadaId: jangada.id, score: r.score });
    } catch (err: any) {
      // permission error or other; record SQL stmt for manual run
      const safeSerial = (jangada.serial || "").replace(/'/g, "''");
      sqlStmts.push(`-- certificadoId=${r.id} score=${r.score}\nUPDATE "CertificadoExtraido" SET "raftSerial" = '${safeSerial}', "updatedAt" = now() WHERE id = ${r.id};`);
      skipped.push({ id: r.id, reason: "update-failed", error: String(err), score: r.score });
    }
  }

  const ts = Date.now();
  const outJson = path.join(logsDir, `apply_fuzzy_updates_${ts}.json`);
  const outSql = path.join(logsDir, `apply_fuzzy_updates_${ts}.sql`);

  fs.writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), threshold, applied, skipped }, null, 2), "utf8");
  if (sqlStmts.length > 0) fs.writeFileSync(outSql, sqlStmts.join("\n\n"), "utf8");

  console.log(`Applied: ${applied.length}, Skipped: ${skipped.length}`);
  console.log(`Wrote JSON -> ${outJson}`);
  if (sqlStmts.length > 0) console.log(`Wrote fallback SQL -> ${outSql}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
