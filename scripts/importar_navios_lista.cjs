const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const rawList = [
  ["PTAVE-113028-N", "PRINCESA SANTA JOANA"],
  ["PTAVE-113027-N", "NOVO VIRGEM DA BARCA"],
  ["PTTZB-112937-C", "CARLOS CUNHA"],
  ["PTVDC-118925-C", "NOSSA"],
  ["PTVDC-112150-N", "SANTA PRINCESA"],
  ["PTAVE-113030-N", "CALVÃO"],
  ["PTAVE-118792-N", "AVEIRENSE"],
  ["PTAVE-113029-N", "COIMBRA"],
  ["PTAVE-117893-N", "SANTA MAFALDA"],
  ["PTAVE-113025-N", "LUTADOR"],
  ["PTAVE-118939-N", "SANTA CRISTINA"],
  ["PTLEI-117426-N", "ILHA BRAVA"],
  ["PTVRE-117633-C", "PIRATA DO MAR"],
  ["PTVDC-117629-C", "VERDEMILHO"],
  ["PTAVE-122129-C", "VISTA ALEGRE"],
  ["PTVIC-112965-C", "PARALELO"],
  ["PTADH-113639-C", "ÁGUAS SANTAS"],
  ["PTPDL-118180-N", "COSTA DE S. JORGE"],
  ["PTHOR-113638-C", "M. ARRIAGA"],
  ["PTFNC-125676-C", "MECA"],
  ["PTAVE-113653-N", "CIDADE DE AMARANTE"],
  ["PTVDC-113651-N", "HEMISFERIO NORTE"],
  ["PTPDL-120455-C", "IRIS DO MAR"],
  ["PTVDP-113664-C", "MESTRE BOBICHA"],
  ["PTHOR-112819-C", "PARMA"],
  ["PTVIC-112716-C", "BRAVO"],
  ["PTPEN-113625-C", "MAR LARGO"],
  ["PTANC-117496-C", "ARTUR E TERESA"],
  ["PTAVE-113611-N", "PASCOAL ATLANTICO"],
  ["PTVRE-117456-C", "GINA MARIA"],
  ["PTPEN-117608-C", "MAR PORTUGUÊS"],
  ["PTVIC-113721-C", "FASCÍNIOS DO MAR"],
  ["PTANC-113771-C", "LAGOAL"],
  ["PTANC-117428-C", "JOANA CUNHA"],
  ["PTSSB-117807-C", "ANACLETO ANTÓNIO"],
  ["PTPDV-113761-C", "MONSERRATE"],
  ["PTSAG-117429-C", "VILA DO INFANTE"],
  ["PTPDV-113814-C", "AVÔ VIANEZ"],
  ["PTANC-113884-C", "NOVO LAGOAL"],
  ["PTANC-113883-C", "ZÉ DO APACHE"],
  ["PTPDV-113878-C", "MARGHERITA"],
  ["PTPDV-118169-C", "PEREIRA E MOÇA"],
  ["PTPEN-113990-C", "JAMAICA"],
  ["PTHOR-119362-C", "GARCIA MIGUEL"],
  ["PTPDV-113967-C", "NOVO MILÉNIO"],
  ["PTPDV-112324-C", "RAIANDO EL SOL"],
  ["PTPDL-113925-C", "LAJES DO PICO"],
  ["PTPDL-113924-C", "AGRIAO"],
  ["PTFNC-125871-C", "RIBEIRA DO MAR"],
  ["PTSSB-119709-C", "FILIPA MIGUEL"],
  ["PTVRE-115219-C", "GLÃ?RIA DO MAR"],
  ["PTVIC-115218-C", "RÉGIO MAR"],
  ["PTPEN-119418-C", "VIRGEM DAS GRAÇAS"],
  ["PTVIC-119605-C", "CARMEN"],
  ["PTPRM-117630-C", "PEDRO TEIXEIRA"],
  ["PTPEN-117631-C", "PORTO DINHEIRO"],
  ["PTSIE-114660-C", "DÁRIO FILIPE"],
  ["PTSIE-117598-C", "ALGAMAR"],
  ["PTANC-117573-C", "ESTRELA DE ÂNCORA"],
  ["PTPEN-114851-C", "EMBRUPA"],
  ["PTCAM-118028-C", "SEMPRE EM FRENTE"],
  ["PTPRM-114789-N", "VALMITÃO"],
  ["PTLOS-115251-C", "SONHO DE INFÂNCIA"],
  ["PTVDC-118159-N", "AVÔ MÚSICO"],
  ["PTVDC-115187-N", "NOVO RUIVO"],
  ["PTAVE-117345-N", "FRANÇA MORTE"],
  ["PTOLH-117343-N", "BALUEIRO"],
  ["PTVDC-117632-N", "MAR DE JAVA"],
  ["PTSIE-115027-C", "ALBERTO MIGUEL"]
];

const PORTOS_AZORES = {
  'PDL': { porto: 'Ponta Delgada', ilha: 'São Miguel', regiao: 'AÇORES' },
  'HOR': { porto: 'Horta', ilha: 'Faial', regiao: 'AÇORES' },
  'ADH': { porto: 'Angra do Heroísmo', ilha: 'Terceira', regiao: 'AÇORES' },
  'ANC': { porto: 'Angra do Heroísmo', ilha: 'Terceira', regiao: 'AÇORES' },
  'VDP': { porto: 'Vila do Porto', ilha: 'Santa Maria', regiao: 'AÇORES' },
  'SMA': { porto: 'Vila do Porto', ilha: 'Santa Maria', regiao: 'AÇORES' },
  'VFC': { porto: 'Vila Franca do Campo', ilha: 'São Miguel', regiao: 'AÇORES' },
  'SCF': { porto: 'Santa Cruz das Flores', ilha: 'Flores', regiao: 'AÇORES' },
  'LDP': { porto: 'Lajes do Pico', ilha: 'Pico', regiao: 'AÇORES' },
  'MDA': { porto: 'Madalena', ilha: 'Pico', regiao: 'AÇORES' },
  'SRP': { porto: 'São Roque do Pico', ilha: 'Pico', regiao: 'AÇORES' },
  'VPT': { porto: 'Velas', ilha: 'São Jorge', regiao: 'AÇORES' },
  'VEL': { porto: 'Velas', ilha: 'São Jorge', regiao: 'AÇORES' },
  'GRA': { porto: 'Santa Cruz da Graciosa', ilha: 'Graciosa', regiao: 'AÇORES' },
  'SCG': { porto: 'Santa Cruz da Graciosa', ilha: 'Graciosa', regiao: 'AÇORES' },
  'PRV': { porto: 'Praia da Vitória', ilha: 'Terceira', regiao: 'AÇORES' },
  'CVO': { porto: 'Corvo', ilha: 'Corvo', regiao: 'AÇORES' },
  'FNC': { porto: 'Funchal', ilha: 'Madeira', regiao: 'MADEIRA' }
};

async function main() {
  console.log(`A processar ${rawList.length} navios da lista...`);
  let added = 0;
  let updated = 0;

  for (const [matricula, nome] of rawList) {
    const matClean = matricula.trim().toUpperCase();
    const match = matClean.match(/^PT([A-Z]{3})/);
    const codigoPorto = match ? match[1] : '';

    const info = PORTOS_AZORES[codigoPorto] || {
      porto: codigoPorto ? `Porto ${codigoPorto}` : 'Desconhecido',
      ilha: 'Continente/Outro',
      regiao: 'CONTINENTE'
    };

    const existing = await prisma.navio.findFirst({
      where: { matricula: matClean }
    });

    if (existing) {
      await prisma.navio.update({
        where: { id: existing.id },
        data: {
          nome: nome.trim(),
          portoRegisto: info.porto,
          ilha: info.ilha,
          territorioGrupo: info.regiao,
        }
      });
      updated++;
    } else {
      await prisma.navio.create({
        data: {
          nome: nome.trim(),
          matricula: matClean,
          tipoPesca: 'Pesca Local',
          portoRegisto: info.porto,
          ilha: info.ilha,
          territorioGrupo: info.regiao,
          ativo: true,
        }
      });
      added++;
    }
  }

  console.log(`Concluído! Adicionados: ${added}, Atualizados: ${updated}`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
