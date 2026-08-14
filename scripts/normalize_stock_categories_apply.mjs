/**
 * Recalcula e aplica categorias canónicas no stock.
 * Uso: node scripts/normalize_stock_categories_apply.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

// Carregar TS via dynamic path do projeto compilado não está disponível;
// reimplementação mínima alinhada com classifyStockItem (import via tsx se existir).
const require = createRequire(import.meta.url);

async function loadClassifier() {
  try {
    // Prefer tsx/ts-node path if registered
    const mod = await import("../src/lib/stock-categories.ts");
    return mod.classifyStockItem || mod.normalizeStockCategory;
  } catch {
    return null;
  }
}

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

function normalizeCategoryText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

// Fallback classifier if TS import fails
function fallbackClassify(item) {
  const combined = normalizeCategoryText(
    [item.categoria, item.descricao, item.referencia, item.codigoFabricante].filter(Boolean).join(" ")
  );
  const rules = [
    { cat: "SINALIZAÇÃO", keys: ["apito", "whistle", "heliog", "espelho de sinal", "quadro de sinais", "retroflect", "retroreflet"] },
    { cat: "PIROTÉCNICOS", keys: ["pirotecn", "foguete", "paraquedas", "rocket", "facho", "flare", "pote de fumo", "smoke"] },
    { cat: "COLETES", keys: ["colete", "lifejacket", "crotchstrap"] },
    { cat: "CABEÇAS DE DISPARO", keys: ["op head", "bobbin", "rearm", "mk5", "ma1", "js1", "uml", "secumar pill"] },
    { cat: "PRIMEIROS SOCORROS", keys: ["farmacia", "first aid", "comprimido", "enjoo", "primeiros socorros"] },
    { cat: "ILUMINAÇÃO", keys: ["lanterna", "torch", "bateria", "pilha", "luz ", "light", "battery"] },
    { cat: "CONTENTORES", keys: ["contentor", "cinta contentor", "canister", "valise", "jogo cintas"] },
    { cat: "TUBOS DE ALTA PRESSÃO", keys: ["mangueira", "hose", "baioneta", "bayonet", "alta pressao"] },
    { cat: "CILINDROS", keys: ["cilindro", "cylinder", "garrafa co2", "co2 "] },
    { cat: "CONSUMÍVEIS", keys: ["racao", "ration", "saco de agua", "agua", "thermal", "pesca", "enjoo bag", "sickness"] },
    { cat: "ACESSÓRIOS", keys: ["fole", "faca", "pagaia", "esponja", "ancora", "manual", "oring", "clip", "batedouro"] },
  ];
  for (const r of rules) {
    if (r.keys.some((k) => combined.includes(k))) return r.cat;
  }
  return item.categoria || "DIVERSOS";
}

async function main() {
  let classify = await loadClassifier();
  if (typeof classify !== "function") {
    console.warn("TS classifier unavailable — using fallback rules.");
    classify = (item) => fallbackClassify(item);
  } else if (classify.length >= 1) {
    // classifyStockItem style
    const fn = classify;
    classify = (item) =>
      fn({
        categoria: item.categoria,
        descricao: item.descricao,
        nome: item.descricao,
        referencia: item.referencia,
        codigoFabricante: item.codigoFabricante,
      });
  }

  const items = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      descricao: true,
      categoria: true,
      codigoFabricante: true,
    },
  });

  const changes = [];
  for (const item of items) {
    const next = classify(item);
    const prev = String(item.categoria || "").trim();
    if (next && next !== prev) {
      changes.push({ id: item.id, ref: item.referencia, desc: item.descricao, from: prev || null, to: next });
    }
  }

  console.log(`Artigos: ${items.length}`);
  console.log(`Alterações: ${changes.length}${dryRun ? " (dry-run)" : ""}`);
  for (const c of changes.slice(0, 40)) {
    console.log(`  #${c.id} ${c.ref || "—"} | ${c.from || "∅"} → ${c.to} | ${c.desc}`);
  }
  if (changes.length > 40) console.log(`  ... +${changes.length - 40} mais`);

  if (!dryRun && changes.length) {
    await prisma.$transaction(
      changes.map((c) =>
        prisma.stock.update({
          where: { id: c.id },
          data: { categoria: c.to },
        })
      )
    );
    console.log("Aplicado.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
