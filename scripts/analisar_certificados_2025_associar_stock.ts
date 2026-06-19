import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type StockLike = {
  id: number;
  referencia: string;
  descricao: string;
  categoria?: string | null;
  codigoFabricante?: string | null;
};

type ValidityRow = {
  item: string;
  validade: string;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateFlexible(value: unknown): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return new Date(direct);

  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (br) {
    const d = Number(br[1]);
    const m = Number(br[2]) - 1;
    const y = Number(br[3].length === 2 ? `20${br[3]}` : br[3]);
    const dt = new Date(y, m, d);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return null;
}

const GROUPS: Array<{ key: string; tokens: string[] }> = [
  { key: "fachos_mao", tokens: ["facho", "fachos", "mao", "mao vermelho", "handflare", "handflares", "fogo de mao"] },
  { key: "paraquedas", tokens: ["paraquedas", "parachute", "rocket", "foguete", "foguetes"] },
  { key: "comprimidos", tokens: ["comprimido", "comprimidos", "pastilha", "pastilhas", "enjoo", "seasickness", "tablet", "tables"] },
  { key: "aguas", tokens: ["agua", "aguas", "water", "potavel"] },
  { key: "racoes", tokens: ["racao", "racoes", "ration", "food"] },
  { key: "farmacia", tokens: ["farmacia", "first aid", "primeiros socorros", "medic", "kit primeiros socorros"] },
  { key: "fumo", tokens: ["fumo", "fumigeno", "smoke"] },
];

function detectGroups(text: string) {
  const norm = normalize(text);
  const groups = new Set<string>();

  for (const g of GROUPS) {
    for (const token of g.tokens) {
      if (norm.includes(normalize(token))) {
        groups.add(g.key);
        break;
      }
    }
  }

  return groups;
}

function buildStockIndex(stock: StockLike[]) {
  return stock.map((s) => {
    const blob = [s.descricao, s.referencia, s.categoria || "", s.codigoFabricante || ""].join(" ");
    const groups = detectGroups(blob);

    return {
      stock: s,
      normBlob: normalize(blob),
      groups,
    };
  });
}

function matchStockItem(rawItem: string, index: ReturnType<typeof buildStockIndex>) {
  const normItem = normalize(rawItem);
  const itemGroups = detectGroups(rawItem);

  let best: { score: number; stock: StockLike } | null = null;

  for (const candidate of index) {
    let score = 0;

    if (candidate.normBlob.includes(normItem)) score += 8;

    for (const grp of itemGroups) {
      if (candidate.groups.has(grp)) score += 5;
    }

    const words = normItem.split(" ").filter((w) => w.length >= 3);
    for (const w of words) {
      if (candidate.normBlob.includes(w)) score += 1;
    }

    if (!best || score > best.score) {
      best = { score, stock: candidate.stock };
    }
  }

  if (!best || best.score < 5) return null;
  return best.stock;
}

async function main() {
  const report: any = {
    processedCertificados: 0,
    certificadosComJangada: 0,
    validitiesLidas: 0,
    associadosAoStock: 0,
    inseridosArtigosJangada: 0,
    ignoradosDuplicados: 0,
    modo: "report-only",
    porJangada: {} as Record<string, Array<{ itemCertificado: string; validade: string; referenciaStock: string; descricaoStock: string }>>,
    semMatchStock: [] as Array<{ certificadoId: number; item: string; validade: string }>,
  };

  const stock = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      descricao: true,
      categoria: true,
      codigoFabricante: true,
    },
  });

  const stockIndex = buildStockIndex(stock);

  const certificados = await prisma.certificadoExtraido.findMany({
    where: { sourceYear: 2025 },
    include: {
      validities: true,
      jangada: { select: { id: true, serial: true } },
    },
    orderBy: { id: "asc" },
  });

  report.processedCertificados = certificados.length;

  for (const cert of certificados) {
    if (!cert.jangada?.id) continue;
    report.certificadosComJangada += 1;

    const rows = (cert.validities || []) as ValidityRow[];
    report.validitiesLidas += rows.length;

    for (const row of rows) {
      const itemName = String(row.item || "").trim();
      const validadeRaw = String(row.validade || "").trim();
      if (!itemName) continue;

      const matched = matchStockItem(itemName, stockIndex);
      if (!matched) {
        report.semMatchStock.push({ certificadoId: cert.id, item: itemName, validade: validadeRaw });
        continue;
      }

      report.associadosAoStock += 1;

      const validadeDate = parseDateFlexible(validadeRaw);
      const key = String(cert.jangada.id);
      if (!report.porJangada[key]) report.porJangada[key] = [];
      report.porJangada[key].push({
        itemCertificado: itemName,
        validade: validadeDate ? validadeDate.toISOString() : validadeRaw,
        referenciaStock: matched.referencia,
        descricaoStock: matched.descricao,
      });
    }
  }

  const reportPath = path.join(process.cwd(), "tmp_certificados_2025_stock_associacao_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("Análise de certificados 2025 concluída.");
  console.log(`Certificados processados: ${report.processedCertificados}`);
  console.log(`Com jangada associada: ${report.certificadosComJangada}`);
  console.log(`Validades lidas: ${report.validitiesLidas}`);
  console.log(`Linhas associadas ao stock: ${report.associadosAoStock}`);
  console.log(`Artigos inseridos em jangadas: ${report.inseridosArtigosJangada}`);
  console.log(`Duplicados ignorados: ${report.ignoradosDuplicados}`);
  console.log(`Sem match de stock: ${report.semMatchStock.length}`);
  console.log(`Relatório: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error("Erro na análise/associação de certificados 2025:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
