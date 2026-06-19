import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  buildChecklistInitialValues,
  buildInspectionChecklistFromQuadro,
  type ChecklistRaftInput,
} from "../src/modules/inspectionChecklist";
import {
  findMatchingArticleForPackItem,
  getMandatoryPackItemsForRaft,
  normalizeMandatoryPackCode,
  type MandatoryPackItem,
} from "../src/modules/rafts/mandatoryPack";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const TARGET_IDS = process.argv
  .filter((arg) => arg.startsWith("--id="))
  .flatMap((arg) => arg.replace("--id=", "").split(","))
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);

const CHECKLIST_STORE_PATH = path.join(
  process.cwd(),
  "auditorias_documentos",
  "_meta",
  "jangadas-inspection-checklist-values.json",
);
const LOG_DIR = path.join(process.cwd(), "prisma", "logs");

const JANGADA_BACKFILL_SELECT = {
  id: true,
  brand: true,
  model: true,
  serial: true,
  packType: true,
  capacity: true,
  owner: true,
  dataFabrico: true,
  containerModel: true,
  cylinderCabecaDisparoRef: true,
  tuboIdentificacao: true,
  dataInspecao: true,
  shipNameManual: true,
  cylinderSerial: true,
  cylinderTara: true,
  cylinderPesoBruto: true,
  cylinderCo2: true,
  cylinderN2: true,
  cylinderDataTeste: true,
  cylinderDataProxTeste: true,
  cylinderSistema: true,
  artigos: {
    where: { inspecaoId: null },
    orderBy: [{ id: "asc" as const }],
    select: {
      id: true,
      name: true,
      quantidade: true,
      validade: true,
      referencia: true,
      codigoFabricante: true,
    },
  },
} as const;

type PrimitiveChecklistValue = string | number | boolean;
type ChecklistStore = Record<string, Record<string, PrimitiveChecklistValue>>;

type RaftArticleLike = {
  id?: number;
  name?: string | null;
  quantidade?: number | string | null;
  validade?: Date | string | null;
  referencia?: string | null;
  codigoFabricante?: string | null;
};

type PersistedArticle = {
  name: string;
  quantidade: number;
  validade: Date | null;
  referencia: string | null;
  codigoFabricante: string | null;
};

type GeneratedChecklistFieldName = string;

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function isSeasavaPlus(brand?: string | null, model?: string | null) {
  const brandText = normalizeText(brand);
  const modelText = normalizeText(model);
  return brandText.includes("RFD") && modelText.includes("SEASAVA PLUS");
}

function normalizeSeasavaPackType(packType?: string | null, model?: string | null) {
  const raw = normalizeText(packType);
  const modelText = normalizeText(model);
  const isSeasava = modelText.includes('SEASAVA PLUS');

  if (!isSeasava) return String(packType || '').trim();
  if (raw.includes('SIMPLIFICADO MINIMO')) return 'R';
  if (raw.includes('SIMPLIFICADO REDUZIDO') || raw === 'REDUZIDO') return 'E';
  return String(packType || '').trim();
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJsonFile<T>(filePath: string, value: T) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeChecklistStoreEntry(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {} as Record<string, PrimitiveChecklistValue>;

  const normalized: Record<string, PrimitiveChecklistValue> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      normalized[key] = value;
    }
  }
  return normalized;
}

function normalizeArticleDate(value?: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  const monthYearMatch = raw.match(/^(\d{1,2})[/-](\d{2,4})$/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = monthYearMatch[2].length === 2 ? 2000 + Number(monthYearMatch[2]) : Number(monthYearMatch[2]);
    if (month >= 1 && month <= 12 && year >= 2000) {
      return `${year}-${String(month).padStart(2, "0")}-01`;
    }
  }

  return null;
}

function buildRaftInput(
  raft: Record<string, any>,
  artigos: PersistedArticle[],
  packType: string,
): ChecklistRaftInput {
  return {
    serial: String(raft.serial || ""),
    brand: String(raft.brand || ""),
    model: String(raft.model || ""),
    capacity: Number(raft.capacity || 0) || undefined,
    owner: String(raft.owner || ""),
    dataFabrico: String(raft.dataFabrico || ""),
    packType,
    containerModel: String(raft.containerModel || ""),
    cylinderCabecaDisparoRef: String(raft.cylinderCabecaDisparoRef || ""),
    tuboIdentificacao: String(raft.tuboIdentificacao || ""),
    dataInspecao: String(raft.dataInspecao || ""),
    shipNameManual: String(raft.shipNameManual || ""),
    cylinder: {
      serial: String(raft.cylinderSerial || ""),
      tara: String(raft.cylinderTara || ""),
      pesoBruto: String(raft.cylinderPesoBruto || ""),
      co2: String(raft.cylinderCo2 || ""),
      n2: String(raft.cylinderN2 || ""),
      dataTeste: String(raft.cylinderDataTeste || ""),
      dataProxTeste: String(raft.cylinderDataProxTeste || ""),
      sistema: String(raft.cylinderSistema || ""),
    },
    artigos: artigos.map((artigo) => ({
      name: artigo.name,
      quantidade: artigo.quantidade,
      validade: artigo.validade ? artigo.validade.toISOString().slice(0, 10) : undefined,
      referencia: artigo.referencia || undefined,
    })),
  };
}

function buildPersistedArticle(
  item: MandatoryPackItem,
  existing?: RaftArticleLike | null,
): PersistedArticle {
  const normalizedDate = normalizeArticleDate(existing?.validade);
  return {
    name: item.label,
    quantidade: item.quantity,
    validade: normalizedDate ? new Date(normalizedDate) : null,
    referencia: existing?.referencia ? String(existing.referencia).trim() : item.reference || null,
    codigoFabricante: existing?.codigoFabricante ? String(existing.codigoFabricante).trim() : null,
  };
}

function toMatchableArticle(article: RaftArticleLike) {
  return {
    name: article.name ? String(article.name).trim() : null,
    quantidade: article.quantidade ?? null,
    validade: normalizeArticleDate(article.validade),
    referencia: article.referencia ? String(article.referencia).trim() : null,
  };
}

function buildArticleSignature(artigos: PersistedArticle[]) {
  return JSON.stringify(
    artigos.map((artigo) => ({
      name: artigo.name,
      quantidade: artigo.quantidade,
      validade: artigo.validade ? artigo.validade.toISOString().slice(0, 10) : null,
      referencia: artigo.referencia,
      codigoFabricante: artigo.codigoFabricante,
    })),
  );
}

function isLegacySeasavaFoodArticle(article: RaftArticleLike) {
  const normalizedName = normalizeText(article.name);
  const normalizedReference = normalizeText(article.referencia);
  return (
    normalizedName.includes("RACAO") ||
    normalizedName.includes("RACOES") ||
    normalizedName.includes("FOOD RATION") ||
    normalizedName.includes("FOOD RATIONS") ||
    normalizedReference.includes("RATION")
  );
}

function isLegacySeasavaWaterArticle(article: RaftArticleLike) {
  const normalizedName = normalizeText(article.name);
  const normalizedReference = normalizeText(article.referencia);
  return (
    normalizedName.includes("AGUA") ||
    normalizedName.includes("WATER") ||
    normalizedReference.includes("WATER")
  );
}

function keepExtraArticleForPack(packCode: string, article: RaftArticleLike) {
  if (isLegacySeasavaFoodArticle(article)) return false;
  if (packCode !== "E" && isLegacySeasavaWaterArticle(article)) return false;
  return true;
}

function collectGeneratedChecklistFieldNames(raftInput: ChecklistRaftInput): Set<GeneratedChecklistFieldName> {
  return new Set(
    buildInspectionChecklistFromQuadro(raftInput)
      .flatMap((section) => section.fields)
      .map((field) => field.name),
  );
}

function mergeChecklistValues(
  defaults: Record<string, PrimitiveChecklistValue>,
  existing: Record<string, PrimitiveChecklistValue>,
  allowedFieldNames: Set<GeneratedChecklistFieldName>,
) {
  const forcedKeys = new Set([
    "serial",
    "ship",
    "brand_model",
    "capacity",
    "owner",
    "dataFabrico",
    "packType",
    "equip_pack_type",
    "data_inspecao",
    "wp_rule",
    "next_gi_date",
    "next_fs_nap_date",
    "gi_rule",
    "fs_nap_rule",
  ]);

  const merged = { ...defaults };
  for (const [key, value] of Object.entries(existing)) {
    if (forcedKeys.has(key)) continue;
    if (!allowedFieldNames.has(key)) continue;
    merged[key] = value;
  }
  return merged;
}

async function main() {
  const checklistStore = readJsonFile<ChecklistStore>(CHECKLIST_STORE_PATH, {});
  const nextChecklistStore: ChecklistStore = { ...checklistStore };

  const jangadas = await prisma.jangada.findMany({
    where: TARGET_IDS.length ? { id: { in: TARGET_IDS } } : undefined,
    select: JANGADA_BACKFILL_SELECT,
    orderBy: [{ id: "asc" }],
  });

  const targetRafts = jangadas.filter((raft) => isSeasavaPlus(raft.brand, raft.model));
  const report: Array<Record<string, unknown>> = [];
  let packUpdates = 0;
  let articleUpdates = 0;
  let checklistUpdates = 0;

  for (const raft of targetRafts) {
    const canonicalPackType = normalizeMandatoryPackCode(normalizeSeasavaPackType(raft.packType, raft.model), raft.model) || normalizeSeasavaPackType(raft.packType, raft.model) || raft.packType;
    const mandatoryItems = getMandatoryPackItemsForRaft({
      brand: raft.brand,
      model: raft.model,
      packType: canonicalPackType,
      capacity: raft.capacity,
    });

    const sourceArticles = [...raft.artigos];
    const remainingArticles = [...sourceArticles];
    const rebuiltMandatoryArticles = mandatoryItems.map((item) => {
      const matched = findMatchingArticleForPackItem(
        item,
        remainingArticles.map((article) => toMatchableArticle(article)),
      );
      if (matched) {
        const matchedIndex = remainingArticles.findIndex((candidate) => {
          const candidateMatchable = toMatchableArticle(candidate);
          return (
            candidateMatchable.name === matched.name &&
            candidateMatchable.referencia === matched.referencia &&
            candidateMatchable.validade === matched.validade &&
            candidateMatchable.quantidade === matched.quantidade
          );
        });
        if (matchedIndex >= 0) remainingArticles.splice(matchedIndex, 1);
      }
      return buildPersistedArticle(item, matched);
    });

    const extraArticles = remainingArticles
      .filter((artigo) => keepExtraArticleForPack(canonicalPackType, artigo))
      .map<PersistedArticle>((artigo) => ({
      name: String(artigo.name || "").trim(),
      quantidade: Number(artigo.quantidade || 0) || 0,
      validade: normalizeArticleDate(artigo.validade) ? new Date(normalizeArticleDate(artigo.validade)!) : null,
      referencia: artigo.referencia ? String(artigo.referencia).trim() : null,
      codigoFabricante: artigo.codigoFabricante ? String(artigo.codigoFabricante).trim() : null,
    }))
      .filter((artigo) => artigo.name);

    const finalArticles = [...rebuiltMandatoryArticles, ...extraArticles];
    const currentArticleSignature = buildArticleSignature(
      sourceArticles.map((artigo) => ({
        name: String(artigo.name || "").trim(),
        quantidade: Number(artigo.quantidade || 0) || 0,
        validade: normalizeArticleDate(artigo.validade) ? new Date(normalizeArticleDate(artigo.validade)!) : null,
        referencia: artigo.referencia ? String(artigo.referencia).trim() : null,
        codigoFabricante: artigo.codigoFabricante ? String(artigo.codigoFabricante).trim() : null,
      })).filter((artigo) => artigo.name),
    );
    const nextArticleSignature = buildArticleSignature(finalArticles);

    const raftInput = buildRaftInput(raft, finalArticles, canonicalPackType);
    const generatedChecklist = buildInspectionChecklistFromQuadro(raftInput);
    const generatedFieldNames = collectGeneratedChecklistFieldNames(raftInput);
    const checklistDefaults = buildChecklistInitialValues(generatedChecklist, raftInput);
    const existingChecklist = normalizeChecklistStoreEntry(checklistStore[String(raft.id)]);
    const mergedChecklist = mergeChecklistValues(checklistDefaults, existingChecklist, generatedFieldNames);

    const currentChecklistSignature = JSON.stringify(existingChecklist);
    const nextChecklistSignature = JSON.stringify(mergedChecklist);

    const needsPackUpdate = canonicalPackType !== raft.packType;
    const needsArticleUpdate = currentArticleSignature !== nextArticleSignature;
    const needsChecklistUpdate = currentChecklistSignature !== nextChecklistSignature;

    if (needsPackUpdate) packUpdates += 1;
    if (needsArticleUpdate) articleUpdates += 1;
    if (needsChecklistUpdate) checklistUpdates += 1;

    report.push({
      id: raft.id,
      serial: raft.serial,
      packType: { from: raft.packType, to: canonicalPackType, changed: needsPackUpdate },
      mandatoryItems: mandatoryItems.length,
      articlesChanged: needsArticleUpdate,
      checklistChanged: needsChecklistUpdate,
    });

    nextChecklistStore[String(raft.id)] = mergedChecklist;

    if (!APPLY) continue;

    await prisma.$transaction(async (tx) => {
      if (needsPackUpdate) {
        await tx.$executeRaw`
          UPDATE "Jangada"
          SET "packType" = ${canonicalPackType}
          WHERE "id" = ${raft.id}
        `;
      }

      if (needsArticleUpdate) {
        await tx.artigoJangada.deleteMany({
          where: { jangadaId: raft.id, inspecaoId: null },
        });

        if (finalArticles.length > 0) {
          await tx.artigoJangada.createMany({
            data: finalArticles.map((artigo) => ({
              jangadaId: raft.id,
              name: artigo.name,
              quantidade: artigo.quantidade,
              validade: artigo.validade,
              referencia: artigo.referencia,
              codigoFabricante: artigo.codigoFabricante,
            })),
          });
        }
      }
    });
  }

  ensureDirectory(LOG_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(LOG_DIR, `backfill_seasava_plus_pack_and_checklists_${timestamp}.json`);
  const summary = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    targetIds: TARGET_IDS,
    scanned: jangadas.length,
    matchedSeasavaPlus: targetRafts.length,
    packUpdates,
    articleUpdates,
    checklistUpdates,
    report,
  };

  if (APPLY) {
    writeJsonFile(CHECKLIST_STORE_PATH, nextChecklistStore);
  }

  writeJsonFile(logPath, summary);
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Log escrito em: ${logPath}`);
}

main()
  .catch((error) => {
    console.error("Erro no backfill das SEASAVA PLUS:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });