const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.gestornavalpro_DATABASE_URL ||
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const FOOD_RATIONS_STOCK_REFERENCE = '320202084';
const DRINKING_WATER_STOCK_REFERENCE = '30202085';

function normalizeCategoryText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeStockCategory(value, descricao) {
  const normalized = normalizeCategoryText(value);
  const description = normalizeCategoryText(descricao);

  const exactMap = {
    sinalizacao: 'SINALIZAÇÃO',
    pirotecnia: 'SINALIZAÇÃO',
    iluminacao: 'ILUMINAÇÃO',
    'iluminacao e baterias': 'ILUMINAÇÃO',
    sobrevivencia: 'SOBREVIVÊNCIA',
    'mecanica e sistemas de disparo': 'EQUIPAMENTO',
    'cabecas de disparo': 'EQUIPAMENTO',
    'primeiros socorros': 'PRIMEIROS SOCORROS',
    consumiveis: 'CONSUMÍVEIS',
    equipamento: 'EQUIPAMENTO',
    'sobrevivencia e consumiveis': 'CONSUMÍVEIS',
    'manutencao e etiquetagem': 'EQUIPAMENTO',
    'sistemas de insuflacao': 'EQUIPAMENTO',
    'componentes criticos de conexao': 'EQUIPAMENTO',
  };

  if (exactMap[normalized]) return exactMap[normalized];
  if (/farm|first aid|primeiros socorros|enjoo|tablet|comprim/.test(description)) return 'PRIMEIROS SOCORROS';
  if (/agua|water|racao|ration|copo|vomito|bag/.test(description)) return 'CONSUMÍVEIS';
  if (/manta|thermal|surviv|heliogra|pesca|whistle|apito/.test(description)) return 'SOBREVIVÊNCIA';
  if (/luz|light|lanterna|torch|bateria|battery/.test(description)) return 'ILUMINAÇÃO';
  if (/foguete|facho|smoke|fumo|sinal/.test(description)) return 'SINALIZAÇÃO';
  return 'EQUIPAMENTO';
}

const CANONICAL_ARTICLE_REFERENCE_OVERRIDES = new Map([
  ['KIT DE PRIMEIROS SOCORROS', {
    referencia: '30202207',
    descricao: 'Ambulância / First Aid Kit',
    categoria: 'Equip. de Emergência',
    codigoFabricante: null,
  }],
  ['FIRST AID KIT', {
    referencia: '30202207',
    descricao: 'Ambulância / First Aid Kit',
    categoria: 'Equip. de Emergência',
    codigoFabricante: null,
  }],
  ['SINAL FUMIGENO', {
    referencia: '20500002',
    descricao: 'Potes de Fumo / Smoke Signals',
    categoria: 'PIROTECNIA',
    codigoFabricante: 'FLR5010',
  }],
  ['SMOKE SIGNALS', {
    referencia: '20500002',
    descricao: 'Potes de Fumo / Smoke Signals',
    categoria: 'PIROTECNIA',
    codigoFabricante: 'FLR5010',
  }],
]);

const QUADRO_JSON = path.join(process.cwd(), 'scripts', 'jangadas_pack_validades_2025.json');

const BASE_RAFT_ARTICLES = [
  'Pá de remo',
  'Esponja',
  'Apito',
  'Faca flutuante',
  'Kit de reparação',
  'Luz flutuante',
  'Luz interior',
  'Luz de localização',
  'Espelho de sinalização',
  'Bússola',
  'Saco de água',
  'Rações',
  'Água potável',
  'Saco de enjoo',
  'Manual de sobrevivência',
  'Manual de sinais',
  'Kit de primeiros socorros',
  'Fogos de mão',
  'Sinal fumígeno',
  'Sinal foguete',
  'Âncora flutuante',
  'Linha de amarração',
  'Linha de lançamento',
  'Caneca',
  'Cobertura térmica',
  'Bolsa de acessórios',
  'Balde',
  'Esponja absorvente',
  'Cordão de segurança',
  'Parachute Rockets',
  'Handflares',
  'Smoke Signals',
  'Inside Light and Battery',
  'Top Light and Battery',
  'First Aid Kit',
  'Seasickness Tables',
  'Rações Alimentares 0,5 Kg',
  'Rampa',
];

const CATALOGO_ARTIGOS = [
  { referencia: 'PYR-ROCKET-RED', descricao: 'Foguete Paraquedas Vermelho', categoria: 'PIROTECNIA', precoVenda: 45.0, codigoFabricante: 'Ikaros/Pains Wessex' },
  { referencia: 'PYR-FLARE-RED', descricao: 'Facho de Mão Vermelho', categoria: 'PIROTECNIA', precoVenda: 18.5, codigoFabricante: 'Ikaros/Pains Wessex' },
  { referencia: 'PYR-SMOKE-ORANGE', descricao: 'Sinal de Fumo Flutuante Laranja', categoria: 'PIROTECNIA', precoVenda: 35.0, codigoFabricante: 'Ikaros/Pains Wessex' },
  { referencia: 'PYR-ROCKET-WHITE', descricao: 'Foguete de Sinalização Branco', categoria: 'PIROTECNIA', precoVenda: 42.0, codigoFabricante: 'Ikaros/Pains Wessex' },
  { referencia: 'LGT-RL5-INT', descricao: 'Luz Interna RL5 (Unidade)', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 22.0, codigoFabricante: 'Survitec' },
  { referencia: 'LGT-RL5-EXT', descricao: 'Luz Externa RL5 (Unidade)', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 28.0, codigoFabricante: 'Survitec' },
  { referencia: 'BAT-RL5-LITH', descricao: 'Bateria Lítio p/ RL5 (Val. 5 Anos)', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 35.0, codigoFabricante: 'Survitec' },
  { referencia: 'LGT-RL6-KIT', descricao: 'Kit Completo Luz RL6 (Int+Ext+Bat)', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 75.0, codigoFabricante: 'Survitec' },
  { referencia: 'LGT-RB2-KIT', descricao: 'Kit Luz RB2 p/ Colete Salvação', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 15.0, codigoFabricante: 'Universal' },
  { referencia: 'LGT-MASTER1', descricao: 'Unidade de Luz Master 1', categoria: 'ILUMINAÇÃO E BATERIAS', precoVenda: 40.0, codigoFabricante: 'Universal' },
  { referencia: 'HRU-HAMMAR-H20', descricao: 'Disparador Hidrostático Hammar H20', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 65.0, codigoFabricante: 'Hammar' },
  { referencia: 'VAL-THAN-OTS65', descricao: 'Válvula Sobrepressão Thanner OTS65', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 85.0, codigoFabricante: 'Thanner' },
  { referencia: 'VAL-LEAF-A6', descricao: 'Válvula de Alívio Leafield A6', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 42.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'LEAF-HD-W', descricao: 'Cabeça de Disparo Leafield GIST (Branca)', categoria: 'CABEÇAS DE DISPARO', precoVenda: 120.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'LEAF-HD-B', descricao: 'Cabeça de Disparo Leafield GIST (Preta)', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'HEAD-THANNER-DK88', descricao: 'Cabeça de Disparo Thanner DK88', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Thanner' },
  { referencia: 'HEAD-UML-MK5', descricao: 'Cabeça/Inflador UML MK5', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'UML' },
  { referencia: 'HEAD-UML-PRO-ELITE', descricao: 'Cabeça/Inflador UML Pro Sensor Elite', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'UML' },
  { referencia: 'HEAD-HAMMAR-MA1', descricao: 'Cabeça/Disparo Hammar MA1', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Hammar' },
  { referencia: 'HEAD-LALIZAS-JS1', descricao: 'Cabeça/Disparo Lalizas JS1', categoria: 'CABEÇAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Lalizas' },
  { referencia: 'CYL-CO2-4L', descricao: 'Cilindro CO2 4L (Corpo Vazio)', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 150.0, codigoFabricante: 'Universal' },
  { referencia: 'GAS-REFILL-CO2', descricao: 'Recarga de Gás CO2 (por Kg)', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 12.0, codigoFabricante: 'Universal' },
  { referencia: FOOD_RATIONS_STOCK_REFERENCE, descricao: 'Ração de Comida 500g (Val. 5 Anos)', categoria: 'SOBREVIVÊNCIA E CONSUMÍVEIS', precoVenda: 14.0, codigoFabricante: 'SOLAS' },
  { referencia: DRINKING_WATER_STOCK_REFERENCE, descricao: 'Água Potável 500ml (Val. 5 Anos)', categoria: 'SOBREVIVÊNCIA E CONSUMÍVEIS', precoVenda: 2.5, codigoFabricante: 'SOLAS' },
  { referencia: 'MED-KIT-SOLAS', descricao: 'Kit Primeiros Socorros SOLAS Completo', categoria: 'SOBREVIVÊNCIA E CONSUMÍVEIS', precoVenda: 55.0, codigoFabricante: 'SOLAS' },
  { referencia: 'TAB-SICKNESS', descricao: 'Pastilhas Enjoo (Pack 10 un.)', categoria: 'SOBREVIVÊNCIA E CONSUMÍVEIS', precoVenda: 8.0, codigoFabricante: 'Universal' },
  { referencia: 'THERM-BLANKET', descricao: 'Manta Térmica de Sobrevivência', categoria: 'SOBREVIVÊNCIA E CONSUMÍVEIS', precoVenda: 12.0, codigoFabricante: 'Universal' },
  { referencia: 'SEAL-WIRE-BLUE', descricao: 'Selo de Arame Azul (Unidade)', categoria: 'MANUTENÇÃO E ETIQUETAGEM', precoVenda: 0.5, codigoFabricante: 'Universal' },
  { referencia: 'TAPE-DONOTCUT', descricao: 'Fita Do Not Cut (Rolo 50m)', categoria: 'MANUTENÇÃO E ETIQUETAGEM', precoVenda: 15.0, codigoFabricante: 'Universal' },
  { referencia: 'GLUE-NEOPRENE', descricao: 'Cola Neoprene Técnica 1L', categoria: 'MANUTENÇÃO E ETIQUETAGEM', precoVenda: 22.0, codigoFabricante: 'Universal' },
  { referencia: 'MULTI-LABEL-SM4', descricao: 'Folha Multi-Etiquetas Surviva MK4', categoria: 'MANUTENÇÃO E ETIQUETAGEM', precoVenda: 18.0, codigoFabricante: 'Survitec' },
  { referencia: 'SYS-LEAF-GIST', descricao: 'Sistema de Insuflação Leafield Marine GIST', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'SYS-THANNER', descricao: 'Sistema de Insuflação THANNER', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Thanner' },
  { referencia: 'SYS-NSS', descricao: 'Sistema de Insuflação NSS (New Safety System)', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Sea-Safe/Eurovinil' },
  { referencia: 'SYS-VTE', descricao: 'Sistema de Insuflação VTE (VTE99/VTE87)', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Survitec/Eurovinil' },
  { referencia: 'SYS-HSR-OH-III', descricao: 'Sistema de Insuflação HSR-OH-III', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Lalizas' },
  { referencia: 'SYS-HALKEY-ROBERTS', descricao: 'Sistema de Insuflação Halkey-Roberts', categoria: 'SISTEMAS DE INSUFLAÇÃO', precoVenda: 0.0, codigoFabricante: 'Halkey-Roberts' },
  { referencia: 'CONN-CYL-YOKE', descricao: 'Cylinder Valve (Yoke)', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'CONN-CYL-THREADED', descricao: 'Cylinder Valve (Threaded)', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'Thanner/NSS' },
  { referencia: 'CONN-M24-NUT', descricao: 'M24 Nut', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'Universal' },
  { referencia: 'CONN-M16', descricao: 'M16 Connector', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'Universal' },
  { referencia: 'VAL-LEAF-A10', descricao: 'Válvula Leafield A10', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'VAL-LEAF-C7', descricao: 'Válvula Leafield C7', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'VAL-LEAF-D7', descricao: 'Válvula Leafield D7', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'VAL-AQF-5-100', descricao: 'Válvula AQF-5-100', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Lalizas' },
  { referencia: 'VAL-71891', descricao: 'Válvula 71891', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Lalizas' },
  { referencia: 'CYL-71863-71867', descricao: 'Cilindros série 71863-71867', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Lalizas' },
  { referencia: 'VAL-PLASTIMO-RELIEF', descricao: 'Válvulas de Alívio 250-350 mbar', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Plastimo' },
  { referencia: 'CYL-PLASTIMO-CO2', descricao: 'Cilindros Plastimo 1.1kg a 3.0kg CO2', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Plastimo' },
  { referencia: 'VAL-SUPERNOVA', descricao: 'Válvula Supernova', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Sea-Safe/Eurovinil' },
  { referencia: 'VAL-BRAVO-2005', descricao: 'Válvula BRAVO 2005', categoria: 'MECÂNICA E SISTEMAS DE DISPARO', precoVenda: 0.0, codigoFabricante: 'Sea-Safe/Eurovinil' },
  { referencia: 'KIT-REARME-GIST', descricao: 'Kit Rearme GIST', categoria: 'MANUTENÇÃO E ETIQUETAGEM', precoVenda: 0.0, codigoFabricante: 'Leafield Marine' },
  { referencia: 'AMARRA-D506', descricao: 'Amarra D506', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'DSB' },
  { referencia: 'AMARRA-D508', descricao: 'Amarra D508', categoria: 'COMPONENTES CRÍTICOS DE CONEXÃO', precoVenda: 0.0, codigoFabricante: 'DSB' },
];

const ASSOCIACOES = [
  {
    marcas: ['ZODIAC'],
    modelos: ['COASTAL', 'PROPECHE CLV/CLVI', 'MOR', 'TO', 'TO SR', 'MKIV'],
    referencias: ['SYS-THANNER', 'SYS-LEAF-GIST', 'VAL-THAN-OTS65', 'VAL-LEAF-A10', 'VAL-LEAF-A6', 'VAL-LEAF-C7', 'VAL-LEAF-D7', 'CYL-CO2-4L', 'GAS-REFILL-CO2']
  },
  {
    marcas: ['RFD'],
    modelos: ['SEASAVA PLUS', 'SEASAVA PRO-ISO', 'SURVIVA MKII', 'SURVIVA MKIII', 'SURVIVA MKIV', 'FERRYMAN'],
    referencias: ['SYS-THANNER', 'SYS-LEAF-GIST', 'SYS-VTE', 'LEAF-HD-W', 'HEAD-THANNER-DK88', 'LGT-RL5-INT', 'LGT-RL5-EXT', 'LGT-RL6-KIT', 'BAT-RL5-LITH', 'VAL-THAN-OTS65', 'KIT-REARME-GIST']
  },
  {
    marcas: ['DSB'],
    modelos: ['LR97', 'LR97 L', 'LR05', 'LR07'],
    referencias: ['SYS-THANNER', 'SYS-LEAF-GIST', 'VAL-THAN-OTS65', 'LEAF-HD-W', 'AMARRA-D506', 'AMARRA-D508']
  },
  {
    marcas: ['LALIZAS'],
    modelos: ['ISO-RAFT', 'LEISURE-RAFT', 'LEISURE RAFT', 'LIFERAFT LEISURE-RAFT', 'LALIZAS LEISURE-RAFT', 'CHARTER', 'OFFSHORE', 'SOLAS LIFE RAFT'],
    referencias: ['SYS-HSR-OH-III', 'HEAD-LALIZAS-JS1', 'VAL-AQF-5-100', 'VAL-71891', 'CYL-71863-71867']
  },
  {
    marcas: ['PLASTIMO'],
    modelos: ['CRUISER', 'TRANSOCEAN ISO 9650-1', 'OFFSHORE'],
    referencias: ['VAL-PLASTIMO-RELIEF', 'CYL-PLASTIMO-CO2']
  },
  {
    marcas: ['SEA-SAFE', 'EUROVINIL'],
    modelos: ['PRO-LIGHT', 'ISO 9650-1', 'LEISURE SYNTESY'],
    referencias: ['SYS-NSS', 'SYS-VTE', 'VAL-SUPERNOVA', 'VAL-BRAVO-2005', 'SEAL-WIRE-BLUE']
  },
  {
    marcas: ['ZODIAC', 'RFD', 'DSB', 'LALIZAS', 'PLASTIMO', 'SEA-SAFE', 'EUROVINIL'],
    modelos: ['COASTAL', 'PROPECHE CLV/CLVI', 'MOR', 'TO', 'TO SR', 'MKIV', 'SEASAVA PLUS', 'SEASAVA PRO-ISO', 'SURVIVA MKII', 'SURVIVA MKIII', 'SURVIVA MKIV', 'FERRYMAN', 'LR97', 'LR97 L', 'LR05', 'LR07', 'ISO-RAFT', 'LEISURE-RAFT', 'LEISURE RAFT', 'LIFERAFT LEISURE-RAFT', 'LALIZAS LEISURE-RAFT', 'CHARTER', 'OFFSHORE', 'SOLAS LIFE RAFT', 'CRUISER', 'TRANSOCEAN ISO 9650-1', 'PRO-LIGHT', 'ISO 9650-1', 'LEISURE SYNTESY'],
    referencias: ['PYR-ROCKET-RED', 'PYR-FLARE-RED', 'PYR-SMOKE-ORANGE', 'PYR-ROCKET-WHITE', FOOD_RATIONS_STOCK_REFERENCE, DRINKING_WATER_STOCK_REFERENCE, 'MED-KIT-SOLAS', 'TAB-SICKNESS', 'THERM-BLANKET', 'HRU-HAMMAR-H20', 'GLUE-NEOPRENE', 'TAPE-DONOTCUT', 'MULTI-LABEL-SM4']
  }
];

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function stableHash(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

function buildReferencia(name) {
  return `JNG-${stableHash(norm(name)).slice(0, 8)}`;
}

function loadQuadroArticles() {
  if (!fs.existsSync(QUADRO_JSON)) return [];
  try {
    const payload = JSON.parse(fs.readFileSync(QUADRO_JSON, 'utf8'));
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    const items = [];

    for (const row of rows) {
      const validities = Array.isArray(row?.validities) ? row.validities : [];
      for (const entry of validities) {
        const article = clean(entry?.item);
        if (article) items.push(article);
      }
    }

    return items;
  } catch {
    return [];
  }
}

function getAssociacoesPorReferencia() {
  const byRef = new Map();

  for (const regra of ASSOCIACOES) {
    const marcas = (regra.marcas || []).map((value) => clean(value)).filter(Boolean);
    const modelos = (regra.modelos || []).map((value) => clean(value)).filter(Boolean);

    for (const referencia of regra.referencias || []) {
      const ref = clean(referencia).toUpperCase();
      if (!ref) continue;

      if (!byRef.has(ref)) {
        byRef.set(ref, {
          marcas: new Set(),
          modelos: new Set(),
        });
      }

      const bucket = byRef.get(ref);
      for (const marca of marcas) bucket.marcas.add(marca);
      for (const modelo of modelos) bucket.modelos.add(modelo);
    }
  }

  return byRef;
}

async function main() {
  const quadroArticles = loadQuadroArticles();
  const associacoesByRef = getAssociacoesPorReferencia();

  const catalogoPorRef = new Map();
  for (const item of CATALOGO_ARTIGOS) {
    const referencia = clean(item.referencia).toUpperCase();
    if (!referencia) continue;
    catalogoPorRef.set(referencia, {
      referencia,
      descricao: clean(item.descricao),
      categoria: normalizeStockCategory(clean(item.categoria) || 'Artigos de Jangada', clean(item.descricao)),
      precoVenda: Number(item.precoVenda ?? 0) || 0,
      codigoFabricante: clean(item.codigoFabricante) || null,
    });
  }

  const basePorRef = new Map();
  for (const articleName of [...BASE_RAFT_ARTICLES, ...quadroArticles]) {
    const descricao = clean(articleName);
    if (!descricao) continue;
    const override = CANONICAL_ARTICLE_REFERENCE_OVERRIDES.get(norm(descricao));
    const referencia = override?.referencia || `JNG-${stableHash(norm(descricao)).slice(0, 8)}`;
    if (!basePorRef.has(referencia)) {
      basePorRef.set(referencia, {
        referencia,
        descricao: override?.descricao || descricao,
        categoria: normalizeStockCategory(override?.categoria || 'Artigos de Jangada', override?.descricao || descricao),
        precoVenda: 0,
        codigoFabricante: override?.codigoFabricante || null,
      });
    }
  }

  const todosItens = [...basePorRef.values(), ...catalogoPorRef.values()].sort((a, b) => {
    const byCategory = String(a.categoria || '').localeCompare(String(b.categoria || ''), 'pt');
    if (byCategory !== 0) return byCategory;
    return String(a.descricao || '').localeCompare(String(b.descricao || ''), 'pt');
  });

  let created = 0;
  let updated = 0;
  let associados = 0;

  for (const item of todosItens) {
    const existing = await prisma.stock.findUnique({ where: { referencia: item.referencia } });
    const assoc = associacoesByRef.get(item.referencia) || null;
    const marcaAplicavel = assoc ? Array.from(assoc.marcas).sort((a, b) => a.localeCompare(b, 'pt')).join(', ') : null;
    const modeloAplicavel = assoc ? Array.from(assoc.modelos).sort((a, b) => a.localeCompare(b, 'pt')).join(', ') : null;
    if (assoc) associados += 1;

    if (!existing) {
      await prisma.stock.create({
        data: {
          referencia: item.referencia,
          descricao: item.descricao,
          categoria: item.categoria,
          associavelJangada: true,
          aplicavelMarcaJangada: marcaAplicavel,
          aplicavelModeloJangada: modeloAplicavel,
          codigoFabricante: item.codigoFabricante,
          precoVenda: item.precoVenda,
          quantidade: 0,
        },
      });
      created += 1;
      continue;
    }

    await prisma.stock.update({
      where: { referencia: item.referencia },
      data: {
        descricao: item.descricao,
        categoria: item.categoria,
        associavelJangada: true,
        aplicavelMarcaJangada: marcaAplicavel,
        aplicavelModeloJangada: modeloAplicavel,
        codigoFabricante: item.codigoFabricante,
        precoVenda: item.precoVenda,
      },
    });
    updated += 1;
  }

  console.log('Seed de artigos associáveis a jangadas concluído.');
  console.log(`Total de artigos: ${todosItens.length}`);
  console.log(`Itens com associação marca/modelo: ${associados}`);
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
}

main()
  .catch((error) => {
    console.error('Erro no seed de artigos de jangada:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
