const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

const records = JSON.parse(
  fs.readFileSync("C:\\Users\\julio\\AppData\\Local\\Temp\\opencode\\embarcacoes_estruturado.json", "utf-8")
);

const PREFIX_TO_PORTO = {
  SCF: "Santa Cruz das Flores",
  VEL: "Velas",
  HOR: "Horta",
  SRP: "São Roque do Pico",
  LDP: "Lajes do Pico",
  SCG: "Santa Cruz da Graciosa",
  ADH: "Angra do Heroísmo",
  PRV: "Praia da Vitória",
  PDL: "Ponta Delgada",
  VFC: "Vila Franca do Campo",
  VDP: "Vila do Porto",
  VE: "Velas",
  H: "Horta",
  LP: "Lajes do Pico",
  SR: "São Roque do Pico",
  AH: "Angra do Heroísmo",
  VV: "Praia da Vitória",
  PD: "Ponta Delgada",
  VP: "Vila do Porto",
};

function extrairPorto(matricula) {
  if (!matricula) return null;
  const m = String(matricula).trim().toUpperCase();
  let match = m.match(/^PT([A-Z]{3})/);
  if (match) return PREFIX_TO_PORTO[match[1]] || null;
  match = m.match(/^([A-Z]{1,2})-\d/);
  if (match) return PREFIX_TO_PORTO[match[1]] || null;
  return null;
}

function normalizarMatricula(v) {
  if (!v) return "";
  return String(v).trim().toUpperCase().replace(/[\s-]/g, "");
}

function normalizarNome(v) {
  if (!v) return "";
  return String(v)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isMatriculaInvalida(v) {
  const n = normalizarMatricula(v);
  if (!n) return true;
  return ["N/D", "ND", "N.D.", "N/A", "NA", "SEMMATRICULA", "SEM MATRÍCULA"].includes(n) || n.startsWith("PRT");
}

async function main() {
  const allNavios = await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, cfr: true, ilha: true, portoRegisto: true, territorioGrupo: true, tipoPesca: true },
  });

  const byMatricula = new Map();
  const byNome = new Map();
  for (const n of allNavios) {
    const m = normalizarMatricula(n.matricula);
    if (m && !byMatricula.has(m)) byMatricula.set(m, n);
    const nm = normalizarNome(n.nome);
    if (nm && !byNome.has(nm)) byNome.set(nm, n);
  }

  let updated = 0;
  let noMatch = [];

  for (const rec of records) {
    const matNormal = normalizarMatricula(rec.matricula);
    const nomeNormal = normalizarNome(rec.nome);
    const porto = extrairPorto(rec.matricula);

    let navio = byMatricula.get(matNormal);
    if (!navio && nomeNormal) navio = byNome.get(nomeNormal);

    if (navio) {
      const updates = {};
      if (!navio.cfr || navio.cfr !== rec.cfr) updates.cfr = rec.cfr;
      if (normalizarMatricula(navio.matricula) !== matNormal) updates.matricula = rec.matricula;
      if (navio.ilha !== rec.ilha) updates.ilha = rec.ilha;
      if (navio.territorioGrupo !== "AÇORES") updates.territorioGrupo = "AÇORES";
      if (!navio.portoRegisto || navio.portoRegisto !== porto) updates.portoRegisto = porto;
      if (!navio.tipoPesca) updates.tipoPesca = "Pesca Local";

      if (Object.keys(updates).length > 0) {
        await prisma.navio.update({ where: { id: navio.id }, data: updates });
        updated++;
      }
    } else {
      noMatch.push(rec);
    }
  }

  console.log(`Atualizados: ${updated}`);
  console.log(`Sem correspondência (a criar): ${noMatch.length}`);
  console.log(`Total da lista: ${records.length}`);

  let created = 0;
  for (const rec of noMatch) {
    const porto = extrairPorto(rec.matricula);
    await prisma.navio.create({
      data: {
        nome: rec.nome.trim(),
        matricula: rec.matricula,
        cfr: rec.cfr,
        ilha: rec.ilha,
        portoRegisto: porto,
        territorioGrupo: "AÇORES",
        tipoPesca: "Pesca Local",
        ativo: true,
      },
    });
    created++;
  }
  console.log(`Criados: ${created}`);

  const fs2 = require("fs");
  fs2.writeFileSync(
    "C:\\Users\\julio\\AppData\\Local\\Temp\\opencode\\embarcacoes_sem_match.json",
    JSON.stringify(noMatch, null, 1),
    "utf-8"
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
