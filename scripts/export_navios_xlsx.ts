/**
 * Exporta o diretório de embarcações (com Região/Ilha/Tipo/Porto e coordenadas)
 * para um ficheiro XLSX com folhas de dados e de distribuição.
 *
 * Uso:
 *   npx tsx scripts/export_navios_xlsx.ts            # escreve em exports/navios_<data>.xlsx
 *   npx tsx scripts/export_navios_xlsx.ts --saida=path.xlsx
 */
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "node:path";
import fs from "node:fs";

const prisma = new PrismaClient();

const ESTADO_LABELS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  abatido: "Abatido",
  naufragado: "Naufragado",
};

const TERRITORIO_ORDEM = ["AÇORES", "MADEIRA", "CONTINENTE"] as const;

async function main() {
  const args = process.argv.slice(2);
  const saidaArg = args.find((a) => a.startsWith("--saida="));
  const saida = saidaArg ? saidaArg.split("=")[1] : `exports/navios_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const navios = await prisma.navio.findMany({
    orderBy: [{ territorioGrupo: "asc" }, { ilha: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      matricula: true,
      cfr: true,
      mmsi: true,
      imo: true,
      callSignal: true,
      portoRegisto: true,
      territorioGrupo: true,
      ilha: true,
      tipoPesca: true,
      tipoNavio: true,
      comprimentoMetros: true,
      lotacao: true,
      potenciaMotorKw: true,
      anoConstrucao: true,
      zonaNavegacao: true,
      proprietario: true,
      bandeira: true,
      estadoNavio: true,
      ativo: true,
      lat: true,
      lng: true,
      cliente: { select: { nome: true, numeroCliente: true } },
    },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Orey Técnica";
  wb.created = new Date();

  const ws = wb.addWorksheet("Embarcações", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "Nome", key: "nome", width: 30 },
    { header: "Matrícula", key: "matricula", width: 16 },
    { header: "CFR", key: "cfr", width: 16 },
    { header: "MMSI", key: "mmsi", width: 14 },
    { header: "IMO", key: "imo", width: 12 },
    { header: "Indicativo", key: "callSignal", width: 12 },
    { header: "Região", key: "territorio", width: 12 },
    { header: "Ilha/Localização", key: "ilha", width: 18 },
    { header: "Porto de Registo", key: "portoRegisto", width: 22 },
    { header: "Tipo de Pesca", key: "tipoPesca", width: 18 },
    { header: "Tipo de Navio", key: "tipoNavio", width: 14 },
    { header: "Comprimento (m)", key: "comprimento", width: 14 },
    { header: "Lotação", key: "lotacao", width: 10 },
    { header: "Potência (kW)", key: "potencia", width: 13 },
    { header: "Ano Construção", key: "ano", width: 14 },
    { header: "Proprietário", key: "proprietario", width: 28 },
    { header: "Bandeira", key: "bandeira", width: 12 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Cliente", key: "cliente", width: 28 },
    { header: "Latitude", key: "lat", width: 12 },
    { header: "Longitude", key: "lng", width: 12 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3C6E" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  const territorioCounts: Record<string, number> = {};
  const ilhaCounts: Record<string, number> = {};
  const tipoCounts: Record<string, number> = {};

  for (const n of navios) {
    const territorio = String(n.territorioGrupo || "—");
    const ilha = String(n.ilha || "—");
    const tipo = String(n.tipoPesca || "—");
    territorioCounts[territorio] = (territorioCounts[territorio] || 0) + 1;
    ilhaCounts[ilha] = (ilhaCounts[ilha] || 0) + 1;
    tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;

    ws.addRow({
      nome: n.nome,
      matricula: n.matricula,
      cfr: n.cfr,
      mmsi: n.mmsi,
      imo: n.imo,
      callSignal: n.callSignal,
      territorio,
      ilha,
      portoRegisto: n.portoRegisto,
      tipoPesca: tipo,
      tipoNavio: n.tipoNavio,
      comprimento: n.comprimentoMetros,
      lotacao: n.lotacao,
      potencia: n.potenciaMotorKw,
      ano: n.anoConstrucao,
      proprietario: n.proprietario,
      bandeira: n.bandeira,
      estado: ESTADO_LABELS[String(n.estadoNavio || "").toLowerCase()] || (n.ativo ? "Ativo" : "Inativo"),
      cliente: n.cliente?.nome,
      lat: n.lat,
      lng: n.lng,
    });
  }

  const summary = wb.addWorksheet("Distribuição");
  summary.columns = [
    { header: "Agrupamento", key: "grupo", width: 30 },
    { header: "Chave", key: "chave", width: 30 },
    { header: "Navios", key: "total", width: 12 },
  ];

  const addGroup = (label: string, counts: Record<string, number>, ordem?: string[]) => {
    const keys = ordem ? ordem.filter((k) => counts[k]) : Object.keys(counts);
    const restantes = Object.keys(counts).filter((k) => !keys.includes(k));
    keys.push(...restantes.sort((a, b) => counts[b] - counts[a]));
    for (const key of keys) {
      summary.addRow({ grupo: label, chave: key, total: counts[key] });
    }
  };

  addGroup("Região", territorioCounts, [...TERRITORIO_ORDEM]);
  addGroup("Ilha / Localização", ilhaCounts);
  addGroup("Tipo de Pesca", tipoCounts);
  summary.addRow({ grupo: "Total", chave: "Todos", total: navios.length });
  summary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3C6E" } };

  fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  await wb.xlsx.writeFile(saida);

  console.log(`Exportados ${navios.length} navios para ${path.resolve(saida)}`);
  console.log("Distribuição por região:", JSON.stringify(territorioCounts));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Erro ao exportar:", err);
  await prisma.$disconnect();
  process.exit(1);
});
