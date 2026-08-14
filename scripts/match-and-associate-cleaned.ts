// scripts/match-and-associate.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StockImportItem {
  referencia: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  precoVenda: number;
  precoCompra: number;
  codigoFabricante: string;
  localizacao: string;
  associavelJangada: boolean;
  estadoArtigo: string;
}

interface MatchResult {
  newItems: any[];
  existingItems: any[];
  jangadaAssociations: any[];
  coleteAssociations: any[];
  packAssociations: any[];
  cilindroChecks: any[];
  summary: {
    total: number;
    new: number;
    existing: number;
    jangada: number;
    colete: number;
    pack: number;
    cilindros: number;
  };
}

const stockData: any[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'stock-import-data.json'), 'utf-8')
);

const CATEGORY_MAP: Record<string, string> = {
  'COLETES': 'COLETES',
  'TUBOS ALTA PRESSAO': 'TUBOS_ALTA_PRESSAO',
  'TUBOS DE ALTA PRESSÃO': 'TUBOS_ALTA_PRESSAO',
  'TUBOS DE IDENTIFICAÇAO': 'TUBOS_IDENTIFICACAO',
  'CABEÇAS DE DISPARO': 'CABECAS_DISPARO',
  'PILHAS': 'PILHAS',
  'JANGADAS': 'JANGADAS',
  'BATERIAS': 'BATERIAS',
  'DIVERSOS': 'DIVERSOS',
  'CINTAS DE FECHO': 'CINTAS_FECHO',
  'CINTA DE DE FECHO': 'CINTAS_FECHO',
  'AUTOCOLANTES': 'AUTOCOLANTES',
  'KITS DE REPARAÇÃO': 'KITS_REPARACAO',
  'PROTEÇOES': 'PROTECOES',
  'VERTEDOUROS': 'VERTEDOUROS',
  'RETENIDAS': 'RETENIDAS',
  'LANTERNAS': 'LANTERNAS',
  'SACOS DE VACUO': 'SACOS_VACUO',
  'SACOC DE DE VÁCUO': 'SACOS_VACUO',
  'CONSUMIVEIS': 'CONSUMIVEIS',
  'VALVULAS': 'VALVULAS',
  'CERTIFICADOS': 'CERTIFICADOS',
  'CILINDROS': 'CILINDROS',
  'VEDANTES': 'VEDANTES',
  'FERRAMENTAS': 'FERRAMENTAS',
  'FACAS': 'FACAS',
  'ZIP DE TIE KG': 'ZIP_TIES',
  'ZIPI DE TIE DAN': 'ZIP_TIES',
  'GRAMPOSZ': 'GRAMPOS_SELOS',
  'PINMES': 'PINOS_SEGURANCA',
  'SACOC DE DE VÁCUO': 'SACOS_VACUO',
  'CINTA DE DE FECHO': 'CINTAS_FECHO',
  'RFPAIRit PU': 'KITS_REPARACAO',
  'FGBERket 15x': 'VEDANTES',
  'FGBER': 'VEDANTES',
  'TETX10A,': 'VEDANTES',
  'HOSEE DE L M': 'TUBOS_ALTA_PRESSAO',
  'CCPPERket 15x': 'VEDANTES',
  'GASKET DE X X': 'VEDANTES',
  'JOINT3 DE X X': 'VEDANTES',
  'TPANNERjo': 'CABECAS_DISPARO',
  'RENEANOHJ': 'CABECAS_DISPARO',
  'DKHperating': 'CABECAS_DISPARO',
  'HEADP': 'CABECAS_DISPARO',
  'UNIONU DE G TH': 'TUBOS_ALTA_PRESSAO',
  'G 1/4TPTORR GA': 'TUBOS_ALTA_PRESSAO',
  'CONNEC OCKCONNECQ': 'TUBOS_ALTA_PRESSAO',
  'QUICK DE FIT CONNECTOR': 'TUBOS_ALTA_PRESSAO',
  'QUICKA DE FIT CONNECTOR': 'TUBOS_ALTA_PRESSAO',
  'OAENAdaptor': 'TUBOS_ALTA_PRESSAO',
  'NMZZLEve': 'TUBOS_ALTA_PRESSAO',
  'PGINTER': 'VEDANTES',
  'PINMES': 'PINOS_SEGURANCA',
  'GRAMPOSZ': 'GRAMPOS_SELOS',
  'GLUEPU': 'KITS_REPARACAO',
  'MOLYKOTEH': 'LUBRIFICANTES',
  'STICKEREC': 'AUTOCOLANTES',
  'ZIPI DE TIE DAN': 'ZIP_TIES',
  'ZIP DE TIE KG': 'ZIP_TIES',
  'ZIP DE TIE DAN': 'ZIP_TIES',
  'CSNTAINER': 'VEDANTES',
  'A R TAILP': 'KITS_REPARACAO',
  'LPAFIELDTransit': 'CABECAS_DISPARO',
  'leafield CCAFIELDRecoil': 'CABECAS_DISPARO',
  'LRAFIELD Hose O': 'TUBOS_ALTA_PRESSAO',
  'LDEIEORSEO': 'TUBOS_ALTA_PRESSAO',
  'LKAFIELDve': 'CABECAS_DISPARO',
  'AW WCTCAO': 'SACOS_VACUO',
  'PINMES': 'PINOS_SEGURANCA',
  'GRAMPOSZ': 'GRAMPOS_SELOS',
  'GLUEPU': 'KITS_REPARACAO',
  'MOLYKOTEH': 'LUBRIFICANTES',
  'STICKEREC': 'AUTOCOLANTES',
};

function normalizeCategory(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!raw) return 'DIVERSOS';
  const upper = raw.toUpperCase();
  return CATEGORY_MAP[upper] || upper.replace(/[^A-Z0-9_]/g, '_');
}

function isJangadaItem(item: any): boolean {
  const cat = item.categoria?.toUpperCase();
  const name = (item.descricao || '').toLowerCase();
  return cat === 'JANGADAS' || 
         name.includes('jangada') || 
         name.includes('seasava') || 
         name.includes('eurovinil') || 
         (name.includes('saco') && name.includes('vacuo') && name.includes('jangada'));
}

function isColeteItem(item: any): boolean {
  const cat = item.categoria?.toUpperCase();
  const name = (item.descricao || '').toLowerCase();
  return cat === 'COLETES' || 
         name.includes('colete') || 
         (name.includes('garrafa co2') && name.includes('gr')) || 
         name.includes('enchimento') || 
         name.includes('cabeça de disparo') || 
         name.includes('bobina') || 
         name.includes('válvula') || 
         name.includes('luz alcalina') || 
         name.includes('clip para luzes');
}

function isPackItem(item: any): boolean {
  const cat = item.categoria?.toUpperCase();
  const name = (item.descricao || '').toLowerCase();
  return cat === 'KITS DE REPARAÇÃO' ||
         name.includes('pack') || 
         name.includes('kit') || 
         name.includes('conjunto') || 
         name.includes('reparação');
}

function isCilindroItem(item: any): boolean {
  const cat = item.categoria?.toUpperCase();
  const name = (item.descricao || '').toLowerCase();
  return cat === 'CILINDROS' ||
         (cat === 'COLETES' && name.includes('garrafa co2')) ||
         (name.includes('cilindro') && !name.includes('tubo'));
}

function inferJangadaModel(name: string): string {
  const nameUpper = name.toUpperCase();
  if (nameUpper.includes('SEASAVA 8P')) return 'SEASAVA_8P';
  if (nameUpper.includes('SEASAVA 6P') || nameUpper.includes('06P')) return 'SEASAVA_6P';
  if (nameUpper.includes('EUROVINIL 6P')) return 'EUROVINIL_6P';
  if (nameUpper.includes('SEASAVA R')) return 'SEASAVA_R';
  if (nameUpper.includes('XTREM 6-8P') || nameUpper.includes('XTREM')) return 'XTREM_6_8P';
  return 'OUTRO';
}

function inferColeteType(name: string): string {
  const nameUpper = name.toUpperCase();
  if (nameUpper.includes('CRIANÇA') || nameUpper.includes('CRIANCA')) return 'INFANTIL';
  if (nameUpper.includes('ADULTO')) return 'ADULTO';
  if (nameUpper.includes('SIGMA')) return 'SIGMA_150N';
  if (nameUpper.includes('AUTOMÁTICO') || nameUpper.includes('AUT.')) return 'AUTOMATICO_150N';
  if (nameUpper.includes('SOLAS')) return 'SOLAS';
  if (nameUpper.includes('INSUFLÁVEL') || nameUpper.includes('INSUFLIVEL')) return 'INSUFLIVEL';
  return 'OUTRO';
}

function inferPackType(name: string): string {
  const nameUpper = name.toUpperCase();
  if (nameUpper.includes('REPARAÇÃO') || nameUpper.includes('REPARACAO')) return 'REPARACAO';
  if (nameUpper.includes('PRIMEIROS SOCORROS') || nameUpper.includes('FARMÁCIA') || nameUpper.includes('FARMACIA')) return 'PRIMEIROS_SOCORROS';
  if (nameUpper.includes('BOBINES') || nameUpper.includes('BOBINA')) return 'BOBINES';
  if (nameUpper.includes('SEASAVA') && nameUpper.includes('PACK')) return 'SEASAVA_PACK';
  if (nameUpper.includes('SOLAS')) return 'SOLAS_PACK';
  return 'OUTRO';
}