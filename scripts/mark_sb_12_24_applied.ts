import { PrismaClient } from "@prisma/client";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getApplicableServiceBulletinsForRaft } from "../src/modules/rafts/serviceBulletins.ts";

const prisma = new PrismaClient();

const TARGET_BULLETIN_ID = "survitec-spare-parts-consolidation-12-24";
const STORE_RELATIVE_PATH = path.join("auditorias_documentos", "_meta", "jangadas-service-bulletins-applied.json");

type ServiceBulletinsAppliedMap = Record<string, boolean>;
type ServiceBulletinsAppliedStore = Record<string, ServiceBulletinsAppliedMap>;

function readStore(storePath: string): ServiceBulletinsAppliedStore {
  if (!existsSync(storePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(storePath, "utf-8")) as ServiceBulletinsAppliedStore;
  } catch {
    return {};
  }
}

function writeStore(storePath: string, value: ServiceBulletinsAppliedStore) {
  const dir = path.dirname(storePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(storePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const storePath = path.join(process.cwd(), STORE_RELATIVE_PATH);
  const currentStore = readStore(storePath);

  const jangadas = await prisma.jangada.findMany({
    select: {
      id: true,
      brand: true,
      model: true,
      capacity: true,
      maxStowageHeight: true,
      dataFabrico: true,
      cylinderSistema: true,
      valvulasAlivio: true,
      serial: true,
    },
    orderBy: { id: "asc" },
  });

  let applicableCount = 0;
  let changedCount = 0;
  const nextStore: ServiceBulletinsAppliedStore = { ...currentStore };

  for (const jangada of jangadas) {
    const applicable = getApplicableServiceBulletinsForRaft({
      brand: jangada.brand,
      model: jangada.model,
      capacity: jangada.capacity,
      maxStowageHeight: jangada.maxStowageHeight,
      dataFabrico: jangada.dataFabrico,
      cylinderSistema: jangada.cylinderSistema,
      valvulasAlivio: jangada.valvulasAlivio,
    }).some((bulletin) => bulletin.id === TARGET_BULLETIN_ID);

    if (!applicable) continue;
    applicableCount += 1;

    const key = String(jangada.id);
    const existing = { ...(currentStore[key] || {}) };
    if (existing[TARGET_BULLETIN_ID] === true) continue;

    nextStore[key] = {
      ...existing,
      [TARGET_BULLETIN_ID]: true,
    };
    changedCount += 1;

    console.log(`• Jangada ${jangada.serial || jangada.id} -> ${TARGET_BULLETIN_ID}`);
  }

  if (!dryRun && changedCount > 0) {
    writeStore(storePath, nextStore);
  }

  console.log(`\nAbrangidas pelo boletim: ${applicableCount}`);
  console.log(`${dryRun ? "Alterações previstas" : "Alterações aplicadas"}: ${changedCount}`);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao marcar SB 12/24 como aplicado:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });