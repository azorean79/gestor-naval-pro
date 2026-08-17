import path from "path";
import { PrismaClient } from "@prisma/client";
import type { TerritorioGrupo } from "../src/lib/portos-regioes";

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
const APPLY = args.includes("--apply");
const datasetArg = args.find((a) => a.startsWith("--dataset="));
const DATASET_FILE = path.resolve(datasetArg ? datasetArg.split("=")[1] : "prisma/data/embarcacoes_pesca_pt.json");

function normKey(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function parseDate(value: string): Date | null {
  const iso = value?.trim();
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const dataset: EmbarcacaoRegisto[] = JSON.parse(
    await (await import("fs")).promises.readFile(DATASET_FILE, "utf8")
  );

  const prisma = new PrismaClient();

  const existing = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      matricula: true,
      ilha: true,
      cfr: true,
      imo: true,
      mmsi: true,
      callSignal: true,
      portoRegisto: true,
      territorioGrupo: true,
      bandeira: true,
      estadoNavio: true,
      tipoNavio: true,
      anoConstrucao: true,
      potenciaMotorKw: true,
      comprimentoMetros: true,
    },
  });

  const byCfr = new Map<string, typeof existing[number][]>();
  const byMatricula = new Map<string, typeof existing[number][]>();

  for (const navio of existing) {
    const cfrKey = normKey(navio.cfr);
    if (cfrKey) {
      const list = byCfr.get(cfrKey) || [];
      list.push(navio);
      byCfr.set(cfrKey, list);
    }
    const matKey = normKey(navio.matricula);
    if (matKey && matKey !== "N/D") {
      const list = byMatricula.get(matKey) || [];
      list.push(navio);
      byMatricula.set(matKey, list);
    }
  }

  type NewRecord = EmbarcacaoRegisto;
  type EnrichRecord = { navio: typeof existing[number]; fonte: EmbarcacaoRegisto };

  const novos: NewRecord[] = [];
  const paraEnriquecer: EnrichRecord[] = [];
  const ambiguos = new Set<string>();
  let jaExistentes = 0;

  for (const fonte of dataset) {
    const cfrKey = normKey(fonte.cfr);
    const matKey = normKey(fonte.matricula);

    let match: typeof existing[number] | null = null;

    const cfrMatches = cfrKey ? byCfr.get(cfrKey) || [] : [];
    const matMatches = matKey ? byMatricula.get(matKey) || [] : [];

    if (cfrMatches.length === 1) {
      match = cfrMatches[0];
    } else if (cfrMatches.length > 1) {
      ambiguos.add(`cfr:${cfrKey}`);
      jaExistentes += 1;
      continue;
    }

    if (!match && matMatches.length === 1) {
      match = matMatches[0];
    } else if (matMatches.length > 1) {
      ambiguos.add(`matricula:${matKey}`);
      jaExistentes += 1;
      continue;
    }

    if (match) {
      paraEnriquecer.push({ navio: match, fonte });
    } else {
      novos.push(fonte);
    }
  }

  const countBy = (fn: (v: EmbarcacaoRegisto) => string | null | undefined) => {
    const counts = new Map<string, number>();
    for (const v of novos) {
      const k = fn(v) || "(sem valor)";
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  console.log(`Modo: ${APPLY ? "APLICAR" : "DRY-RUN"}`);
  console.log(`Dataset: ${DATASET_FILE}`);
  console.log(`Existentes na BD: ${existing.length}`);
  console.log(`A CRIAR: ${novos.length} | a enriquecer: ${paraEnriquecer.length} | já existentes/ambíguos: ${jaExistentes}`);
  if (ambiguos.size) {
    console.log(`Matrículas/CFR ambíguos (${ambiguos.size}): ${[...ambiguos].slice(0, 10).join(", ")}${ambiguos.size > 10 ? ", ..." : ""}`);
  }

  if (novos.length) {
    console.log("Novos por território:");
    for (const [k, n] of countBy((v) => v.territorioGrupo)) console.log(`  ${k}: ${n}`);
    console.log("Novos por ilha (top 15):");
    for (const [k, n] of countBy((v) => v.ilha).slice(0, 15)) console.log(`  ${k}: ${n}`);
    console.log("Novos por tipo de pesca:");
    for (const [k, n] of countBy((v) => v.tipoPesca)) console.log(`  ${k}: ${n}`);
    console.log("Novos sem nome (só por matrícula):", novos.filter((v) => !v.nome || v.nome === "Sem nome").length);
    console.log("Novos sem matrícula:", novos.filter((v) => !v.matricula).length);
    console.log("Novos sem cfr:", novos.filter((v) => !v.cfr).length);
    console.log("Amostra (primeiros 8):");
    novos.slice(0, 8).forEach((v) =>
      console.log(`  ${v.nome} | ${v.matricula} | ${v.portoRegisto} | ${v.territorioGrupo} | ${v.ilha} | ${v.tipoPesca}`)
    );
  }

  if (APPLY) {
    let criados = 0;
    const BATCH = 500;
    for (let i = 0; i < novos.length; i += BATCH) {
      const chunk = novos.slice(i, i + BATCH);
      const data = chunk.map((v) => ({
        nome: v.nome || "Sem nome",
        matricula: v.matricula || `CFR-${v.cfr}`,
        ilha: v.ilha || v.territorioGrupo || "Continente",
        tipoPesca: v.tipoPesca || "Pesca Local",
        tipoNavio: v.tipoNavio || "Pesca",
        comprimentoMetros: v.comprimentoMetros,
        anoConstrucao: v.anoConstrucao,
        potenciaMotorKw: v.potenciaMotorKw,
        estadoNavio: "ativo",
        dataEstado: parseDate(v.dataInscricao),
        proprietario: null,
        bandeira: v.bandeira || "Portugal",
        mmsi: v.mmsi || null,
        imo: v.imo || null,
        callSignal: v.callSignal || null,
        portoRegisto: v.portoRegisto || null,
        cfr: v.cfr || null,
        territorioGrupo: v.territorioGrupo,
        ativo: true,
      }));
      const res = await prisma.navio.createMany({ data });
      criados += res.count;
    }
    console.log(`Criados: ${criados}`);

    let atualizados = 0;
    for (const { navio, fonte } of paraEnriquecer) {
      const data: Record<string, unknown> = {};
      if (!navio.cfr && fonte.cfr) data.cfr = fonte.cfr;
      if (!navio.imo && fonte.imo) data.imo = fonte.imo;
      if (!navio.mmsi && fonte.mmsi) data.mmsi = fonte.mmsi;
      if (!navio.callSignal && fonte.callSignal) data.callSignal = fonte.callSignal;
      if (!navio.portoRegisto && fonte.portoRegisto) data.portoRegisto = fonte.portoRegisto;
      if (!navio.territorioGrupo && fonte.territorioGrupo) data.territorioGrupo = fonte.territorioGrupo;
      if (!navio.ilha && fonte.ilha) data.ilha = fonte.ilha;
      if (navio.bandeira == null && fonte.bandeira) data.bandeira = fonte.bandeira;
      if (!navio.estadoNavio && fonte.estadoNavio) data.estadoNavio = fonte.estadoNavio;
      if (!navio.tipoNavio && fonte.tipoNavio) data.tipoNavio = fonte.tipoNavio;
      if (navio.anoConstrucao == null && fonte.anoConstrucao != null) data.anoConstrucao = fonte.anoConstrucao;
      if (navio.potenciaMotorKw == null && fonte.potenciaMotorKw != null) data.potenciaMotorKw = fonte.potenciaMotorKw;
      if (navio.comprimentoMetros == null && fonte.comprimentoMetros != null) data.comprimentoMetros = fonte.comprimentoMetros;
      const keys = Object.keys(data);
      if (!keys.length) continue;
      await prisma.navio.update({ where: { id: navio.id }, data });
      atualizados += 1;
    }
    console.log(`Enriquecidos: ${atualizados} de ${paraEnriquecer.length}`);
  } else {
    console.log("(dry-run — sem alterações. Use --apply para aplicar.)");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
