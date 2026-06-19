// Inferência automática de campos detalhados para jangadas
function inferOwner(j: any): string {
  // Prioriza owner, depois shipNameManual
  if (j.owner) return j.owner;
  if (j.shipNameManual) return j.shipNameManual;
  return '';
}

function inferIlha(j: any): string {
  // Tenta inferir ilha a partir do nome do navio associado
  const n = (j.shipNameManual || '').toUpperCase();
  if (n.includes('HORTA')) return 'Faial';
  if (n.includes('SÃO MIGUEL') || n.includes('SAO MIGUEL')) return 'São Miguel';
  if (n.includes('MAIA')) return 'São Miguel';
  if (n.includes('AMARELA')) return 'Pico';
  if (n.includes('CORVO')) return 'Corvo';
  if (n.includes('FLORES')) return 'Flores';
  if (n.includes('TERCEIRA')) return 'Terceira';
  if (n.includes('GRACIOSA')) return 'Graciosa';
  if (n.includes('SANTA MARIA')) return 'Santa Maria';
  if (n.includes('SÃO JORGE') || n.includes('SAO JORGE')) return 'São Jorge';
  if (n.includes('FAIAL')) return 'Faial';
  if (n.includes('PIA')) return 'Pico';
  return 'Desconhecida';
}

function inferPackType(j: any): string {
  // Normaliza packType
  if (j.packType) return j.packType;
  if (j.artigos && typeof j.artigos === 'string' && j.artigos.includes('SOLAS')) return 'SOLAS';
  return 'Desconhecido';
}


import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Carrega dados completos de jangadas dos certificados
const report = JSON.parse(fs.readFileSync('scripts/import_certificados_2025_report.json', 'utf8'));
const artigosData = JSON.parse(fs.readFileSync('scripts/jangadas_pack_validades_2025.json', 'utf8'));
const artigosMap = new Map();
for (const row of artigosData.rows || []) {
  if (row.raftSerial && Array.isArray(row.validities)) {
    artigosMap.set(String(row.raftSerial).trim(), row.validities);
  }
}

type CertificadoJangada = {
  raftSerial: string;
  brandModel?: string;
  dateManuf?: string;
  emergencyPackType?: string;
  capacity?: number;
  ownerName?: string;
  shipName?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  cylinderSerial?: string;
  co2Charge?: string;
  n2Charge?: string;
};

// Prepare default inspection dates (use certificate dates when available)
const _now = new Date();
const _defaultInspection = _now.toISOString().slice(0, 10);
const _next = new Date(_now);
_next.setFullYear(_next.getFullYear() + 1);
const _defaultNextInspection = _next.toISOString().slice(0, 10);

const jangadas = ((report.sample || []) as CertificadoJangada[])
  .concat((report.unresolved || []) as CertificadoJangada[])
  .filter((j: CertificadoJangada) => j.raftSerial)
  .map((j: CertificadoJangada) => {
    const serial = String(j.raftSerial).trim();
    // Marca/modelo pode vir junto
    let brand = '', model = '';
    if (j.brandModel) {
      // Tenta separar marca/modelo por espaço ou hífen
      const parts = j.brandModel.split(/[- ]+/);
      brand = parts[0] || '';
      model = parts.slice(1).join(' ') || '';
    }
    return {
      brand,
      model,
      serial,
      dataFabrico: j.dateManuf || '',
      packType: j.emergencyPackType || '',
      capacity: j.capacity || 0,
      owner: j.ownerName || '',
      shipId: null,
      shipNameManual: j.shipName || '',
      // prefer dates extracted from certificados 2025; fall back to defaults
      dataInspecao: j.inspectionDate || _defaultInspection,
      dataProxInspecao: j.nextInspectionDate || _defaultNextInspection,
      cylinderSerial: j.cylinderSerial || '',
      cylinderTara: '',
      cylinderPesoBruto: '',
      cylinderCo2: j.co2Charge || '',
      cylinderN2: j.n2Charge || '',
      cylinderDataTeste: '',
      cylinderDataProxTeste: '',
      cylinderSistema: '',
      hruReferencia: '',
      hruDataInstalacao: '',
      hruValidade: '',
      artigos: JSON.stringify(artigosMap.get(serial) || []),
      tuboIdentificacao: '',
      certificadoAtivoId: null,
    };
  });

async function main() {
  for (const j of jangadas) {
    // Enriquecimento automático dos campos
    const enriched = {
      ...j,
      owner: inferOwner(j) || '',
      packType: inferPackType(j) || '',
      brand: j.brand ?? '',
      model: j.model ?? '',
      serial: j.serial ?? '',
      dataFabrico: j.dataFabrico ?? '',
      capacity: j.capacity ?? 0,
      shipNameManual: j.shipNameManual ?? '',
      dataInspecao: j.dataInspecao ?? '',
      dataProxInspecao: j.dataProxInspecao ?? '',
      cylinderSerial: j.cylinderSerial ?? '',
      cylinderTara: j.cylinderTara ?? '',
      cylinderPesoBruto: j.cylinderPesoBruto ?? '',
      cylinderCo2: j.cylinderCo2 ?? '',
      cylinderN2: j.cylinderN2 ?? '',
      cylinderDataTeste: j.cylinderDataTeste ?? '',
      cylinderDataProxTeste: j.cylinderDataProxTeste ?? '',
      cylinderSistema: j.cylinderSistema ?? '',
      hruReferencia: j.hruReferencia ?? '',
      hruDataInstalacao: j.hruDataInstalacao ?? '',
      hruValidade: j.hruValidade ?? '',
      artigos: j.artigos ?? '',
      tuboIdentificacao: j.tuboIdentificacao ?? '',
      certificadoAtivoId: j.certificadoAtivoId ?? undefined,
    };
    await prisma.jangada.upsert({
      where: { serial: enriched.serial },
      update: enriched,
      create: enriched,
    });
  }
  console.log('Seed de jangadas concluído com enriquecimento automático.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
