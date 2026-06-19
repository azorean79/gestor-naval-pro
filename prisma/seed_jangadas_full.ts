// ATENÇÃO: Este arquivo foi gerado automaticamente a partir de scripts/jangadas_pack_validades_2025.json
// Todos os campos além de serial, packType, shipNameManual e artigos são null.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type Jangada = {
  brand: string | null;
  model: string | null;
  serial: string | null;
  dataFabrico: string | null;
  packType: string | null;
  capacity: number | null;
  owner: string | null;
  shipId: number | null;
  shipNameManual: string | null;
  dataInspecao: string | null;
  dataProxInspecao: string | null;
  cylinderSerial: string | null;
  cylinderTara: string | null;
  cylinderPesoBruto: string | null;
  cylinderCo2: string | null;
  cylinderN2: string | null;
  cylinderDataTeste: string | null;
  cylinderDataProxTeste: string | null;
  cylinderSistema: string | null;
  hruReferencia: string | null;
  hruDataInstalacao: string | null;
  hruValidade: string | null;
  artigos: string | null;
  tuboIdentificacao: string | null;
  certificadoAtivoId: number | null;
};

const jangadas: Jangada[] = [
// ... Os dados completos serão inseridos aqui ...
];



function fillDefaults(obj: any) {
  // Ajuste os campos obrigatórios conforme o modelo Prisma
  return {
    brand: obj.brand ?? '',
    model: obj.model ?? '',
    serial: obj.serial ?? '',
    dataFabrico: obj.dataFabrico ?? '',
    packType: obj.packType ?? '',
    capacity: obj.capacity ?? 0,
    owner: obj.owner ?? '',
    shipId: obj.shipId ?? undefined,
    shipNameManual: obj.shipNameManual ?? '',
    dataInspecao: obj.dataInspecao ?? '',
    dataProxInspecao: obj.dataProxInspecao ?? '',
    cylinderSerial: obj.cylinderSerial ?? '',
    cylinderTara: obj.cylinderTara ?? '',
    cylinderPesoBruto: obj.cylinderPesoBruto ?? '',
    cylinderCo2: obj.cylinderCo2 ?? '',
    cylinderN2: obj.cylinderN2 ?? '',
    cylinderDataTeste: obj.cylinderDataTeste ?? '',
    cylinderDataProxTeste: obj.cylinderDataProxTeste ?? '',
    cylinderSistema: obj.cylinderSistema ?? '',
    hruReferencia: obj.hruReferencia ?? '',
    hruDataInstalacao: obj.hruDataInstalacao ?? '',
    hruValidade: obj.hruValidade ?? '',
    artigos: obj.artigos ?? '',
    tuboIdentificacao: obj.tuboIdentificacao ?? '',
    certificadoAtivoId: obj.certificadoAtivoId ?? undefined,
  };
}

async function main() {
  for (const j of jangadas) {
    const clean = fillDefaults(j);
    await prisma.jangada.upsert({
      where: { serial: clean.serial },
      update: clean,
      create: clean,
    });
  }
  console.log('Seed de jangadas concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
