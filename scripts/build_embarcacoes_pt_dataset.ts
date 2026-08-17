import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { getPortoRegiao, type TerritorioGrupo } from "../src/lib/portos-regioes";

type EmbarcacaoRegisto = {
  cfr: string;
  nome: string;
  matricula: string;
  portoRegisto: string;
  portoRegistoCode: string;
  territorioGrupo: TerritorioGrupo | null;
  ilha: string;
  tipoPesca: string;
  tipoNavio: string;
  comprimentoMetros: number | null;
  anoConstrucao: number | null;
  potenciaMotorKw: number | null;
  gt: number | null;
  mmsi: string;
  imo: string;
  callSignal: string;
  artePesca: string;
  hullMaterial: string;
  dataInscricao: string;
  bandeira: string;
  estadoNavio: string;
};

const args = process.argv.slice(2);

const inputArg = args.find((a) => a.startsWith("--input="));
const outputArg = args.find((a) => a.startsWith("--output="));
const limitArg = args.find((a) => a.startsWith("--limit="));

const INPUT_FILE = path.resolve(inputArg ? inputArg.split("=")[1] : "_tmp_embarcacoes_europeias.xlsx");
const OUTPUT_FILE = path.resolve(outputArg ? outputArg.split("=")[1] : "prisma/data/embarcacoes_pesca_pt.json");
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;

function toNum(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().replace(/\s+/g, "");
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function lastNonEmpty(current: string, next: string): string {
  return (next || "").trim() ? next.trim() : current;
}

function deriveTipoPesca(loa: number | null, matricula: string): string {
  const m = (matricula || "").trim().toUpperCase();
  if (m.endsWith("AL")) return "Auxiliar Local";
  if (m.endsWith("TL")) return "Tráfego Local";
  if (loa !== null && loa > 12) return "Pesca do Largo";
  if (m.endsWith("C") || m.endsWith("N")) return "Pesca Costeira";
  return "Pesca Local";
}

const workbook = XLSX.readFile(INPUT_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<Array<string | number>>(sheet, {
  header: 1,
  defval: "",
  raw: false,
});

const header = rows[0];
const colIndex = new Map<string, number>();
header.forEach((h, i) => colIndex.set(String(h), i));
const col = (name: string) => colIndex.get(name) as number;

const iCountry = col("Country of Registration");
const iEvent = col("Event Type");
const iCFR = col("CFR");
const iName = col("Name of Vessel");
const iMark = col("External Marking");
const iPlace = col("Place of Registration Name");
const iPlaceCode = col("Place of Registration Code");
const iUVI = col("UVI");
const iMMSI = col("MMSI");
const iIRCS = col("IRCS");
const iYear = col("Year of Construction");
const iPower = col("Power of Main Engine (kW)");
const iLOA = col("LOA (m)");
const iGT = col("Tonnage GT");
const iGear = col("Main Fishing Gear");
const iHull = col("Hull Material");
const iStart = col("Event Start Date");

type VesselAcc = {
  ret: boolean;
  rows: Array<Array<string | number>>;
};

const byCfr = new Map<string, VesselAcc>();

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (String(row[iCountry] || "") !== "PRT") continue;
  const cfr = String(row[iCFR] || "").trim();
  if (!cfr) continue;
  let acc = byCfr.get(cfr);
  if (!acc) {
    acc = { ret: false, rows: [] };
    byCfr.set(cfr, acc);
  }
  const eventType = String(row[iEvent] || "");
  if (eventType === "RET" || eventType === "EXP") acc.ret = true;
  acc.rows.push(row);
}

const result: EmbarcacaoRegisto[] = [];
const unknownPorts = new Set<string>();

for (const [cfr, acc] of byCfr) {
  if (acc.ret) continue;
  const sorted = [...acc.rows].sort((a, b) => String(a[iStart] || "").localeCompare(String(b[iStart] || "")));

  let nome = "";
  let matricula = "";
  let portoRegisto = "";
  let portoCode = "";
  let uvi = "";
  let mmsi = "";
  let ircs = "";
  let year = "";
  let power = "";
  let loa = "";
  let gt = "";
  let gear = "";
  let hull = "";
  let start = "";

  for (const row of sorted) {
    nome = lastNonEmpty(nome, String(row[iName] || ""));
    matricula = lastNonEmpty(matricula, String(row[iMark] || ""));
    portoRegisto = lastNonEmpty(portoRegisto, String(row[iPlace] || ""));
    portoCode = lastNonEmpty(portoCode, String(row[iPlaceCode] || ""));
    uvi = lastNonEmpty(uvi, String(row[iUVI] || ""));
    mmsi = lastNonEmpty(mmsi, String(row[iMMSI] || ""));
    ircs = lastNonEmpty(ircs, String(row[iIRCS] || ""));
    year = lastNonEmpty(year, String(row[iYear] || ""));
    power = lastNonEmpty(power, String(row[iPower] || ""));
    loa = lastNonEmpty(loa, String(row[iLOA] || ""));
    gt = lastNonEmpty(gt, String(row[iGT] || ""));
    gear = lastNonEmpty(gear, String(row[iGear] || ""));
    hull = lastNonEmpty(hull, String(row[iHull] || ""));
    start = lastNonEmpty(start, String(row[iStart] || ""));
  }

  const porto = getPortoRegiao(portoRegisto);
  if (!porto && portoRegisto) unknownPorts.add(portoRegisto);

  const loaNum = toNum(loa);

  result.push({
    cfr,
    nome: nome || "Sem nome",
    matricula: matricula || "",
    portoRegisto: portoRegisto || "",
    portoRegistoCode: portoCode || "",
    territorioGrupo: porto ? porto.territorioGrupo : null,
    ilha: porto ? porto.ilha : "",
    tipoPesca: deriveTipoPesca(loaNum, matricula),
    tipoNavio: "Pesca",
    comprimentoMetros: loaNum,
    anoConstrucao: toNum(year),
    potenciaMotorKw: toNum(power),
    gt: toNum(gt),
    mmsi: mmsi || "",
    imo: uvi || "",
    callSignal: ircs || "",
    artePesca: gear || "",
    hullMaterial: hull || "",
    dataInscricao: start || "",
    bandeira: "Portugal",
    estadoNavio: "ativo",
  });

  if (LIMIT && result.length >= LIMIT) break;
}

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");

const countTerritorio = (t: TerritorioGrupo | null) =>
  result.filter((v) => v.territorioGrupo === t).length;
const countIlha = (i: string) => result.filter((v) => v.ilha === i).length;

console.log(`Input: ${INPUT_FILE}`);
console.log(`Output: ${OUTPUT_FILE}`);
console.log(`Total embarcações ativas: ${result.length}`);
console.log(`AÇORES: ${countTerritorio("AÇORES")} | MADEIRA: ${countTerritorio("MADEIRA")} | CONTINENTE: ${countTerritorio("CONTINENTE")} | sem território: ${countTerritorio(null)}`);
console.log(`Açores por ilha: ${JSON.stringify({ Corvo: countIlha("Corvo"), Flores: countIlha("Flores"), Faial: countIlha("Faial"), Pico: countIlha("Pico"), "São Jorge": countIlha("São Jorge"), Graciosa: countIlha("Graciosa"), Terceira: countIlha("Terceira"), "São Miguel": countIlha("São Miguel"), "Santa Maria": countIlha("Santa Maria"), Açores: countIlha("Açores") })}`);
console.log(`Continente por região: ${JSON.stringify({ Norte: countIlha("Norte"), Centro: countIlha("Centro"), Sul: countIlha("Sul") })}`);
const tipoCount = result.reduce<Record<string, number>>((acc, v) => {
  acc[v.tipoPesca] = (acc[v.tipoPesca] || 0) + 1;
  return acc;
}, {});
console.log(`Tipo de pesca: ${JSON.stringify(tipoCount)}`);
console.log(`Portos não mapeados (${unknownPorts.size}): ${[...unknownPorts].sort().join(" | ")}`);
console.log("Amostra:");
result.slice(0, 5).forEach((v) =>
  console.log(JSON.stringify({ cfr: v.cfr, nome: v.nome, matricula: v.matricula, porto: v.portoRegisto, territorio: v.territorioGrupo, ilha: v.ilha, tipo: v.tipoPesca, loa: v.comprimentoMetros }))
);
