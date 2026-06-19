import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const CANONICAL_BELLOWS_NAME = "Bellows";
const CANONICAL_BELLOWS_REFERENCE = "20402009";
const BELLOWS_REFERENCE_CANDIDATES = [
  CANONICAL_BELLOWS_REFERENCE,
  "45201002",
  "R45201001",
];
const BELLOWS_NAME_CANDIDATES = [
  "Bellows",
  "Pump / Bellows",
  "Pump",
  "Bomba / Fole",
  "Bomba de Ar / Fole",
  "Fole",
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const normalizedCandidates = BELLOWS_NAME_CANDIDATES.map((value) => normalizeText(value));
const normalizedReferenceCandidates = BELLOWS_REFERENCE_CANDIDATES.map((value) => normalizeText(value));

function isBellowsLike(value: unknown) {
  const normalized = normalizeText(value);
  return normalizedCandidates.includes(normalized);
}

function isBellowsReferenceLike(value: unknown) {
  const normalized = normalizeText(value);
  return normalizedReferenceCandidates.includes(normalized);
}

async function main() {
  const dryRun = new Set(process.argv.slice(2)).has("--dry-run");
  const db = prisma as any;

  const artigos = await db.artigo.findMany({
    where: {},
    select: { id: true, name: true, referencia: true },
  });

  const artigosJangada = await db.artigoJangada.findMany({
    where: {},
    select: { id: true, name: true, referencia: true, jangadaId: true },
    orderBy: [{ jangadaId: "asc" }, { id: "asc" }],
  });

  const artigoIds = artigos
    .filter((row: { name: string; referencia?: string | null }) => isBellowsLike(row.name) || isBellowsReferenceLike(row.referencia))
    .map((row: { id: number }) => row.id);
  const jangadaRows = artigosJangada.filter(
    (row: { name: string; referencia?: string | null }) => isBellowsLike(row.name) || isBellowsReferenceLike(row.referencia)
  );

  const mergedByJangada = new Map<number, Array<{ id: number; name: string }>>();
  for (const row of jangadaRows) {
    if (!mergedByJangada.has(row.jangadaId)) mergedByJangada.set(row.jangadaId, []);
    mergedByJangada.get(row.jangadaId)!.push({ id: row.id, name: row.name });
  }

  const summary = {
    artigosToRename: artigoIds.length,
    jangadasWithBellowsRows: mergedByJangada.size,
    jangadaRowsTouched: jangadaRows.length,
    canonicalReference: CANONICAL_BELLOWS_REFERENCE,
  };

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, summary }, null, 2));
    return;
  }

  if (artigoIds.length > 0) {
    await db.artigo.updateMany({
      where: { id: { in: artigoIds } },
      data: { name: CANONICAL_BELLOWS_NAME, referencia: CANONICAL_BELLOWS_REFERENCE },
    });
  }

  for (const [, rows] of mergedByJangada.entries()) {
    const [primary, ...duplicates] = rows;

    await prisma.$transaction([
      db.artigoJangada.update({
        where: { id: primary.id },
        data: { name: CANONICAL_BELLOWS_NAME, referencia: CANONICAL_BELLOWS_REFERENCE },
      }),
      ...duplicates.map((duplicate: { id: number }) =>
        db.artigoJangada.delete({ where: { id: duplicate.id } })
      ),
    ]);
  }

  console.log(JSON.stringify({ dryRun: false, summary, canonicalName: CANONICAL_BELLOWS_NAME, canonicalReference: CANONICAL_BELLOWS_REFERENCE }, null, 2));
}

main()
  .catch((error) => {
    console.error("Erro ao normalizar o artigo Bellows:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });