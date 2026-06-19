const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MANUAL_PARTS_DIR = path.join(process.cwd(), 'public', 'manual-parts');
const MANUAL_PARTS_LR97_DIR = path.join(process.cwd(), 'public', 'manual-parts-lr97');

const PLASTIMO_MODELOS = 'CRUISER, OFFSHORE, TRANSOCEAN ISO 9650-1';

const CYLINDER_REFS = [
  '40416', '40417', '40418', '40419', '40420', '40421', '40422', '40423', '40424', '40425', '40426',
  '49370', '49371', '49376', '49380', '49386', '49389', '49394', '49401', '49408', '49414', '49415',
  '49420', '49422', '49425', '50539', '52168', '52538', '54756', '54762', '54776', '54806', '54807',
  '54834', '56313', '56314', '56315', '56321', '57145', '57270', '57273', '57277', '57278', '57279',
  '57878', '58624', '60119',
];

const VALVE_REFS = ['11036', '57537'];
const PROTECTION_REFS = ['37749'];
const STRICT_DISTINCT_REFS = new Set(['11036']);

function asText(value) {
  return String(value ?? '').trim();
}

function normalizeToken(value) {
  return asText(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function listImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((fileName) => /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName));
}

function buildImageIndex() {
  const index = new Map();
  for (const fileName of listImageFiles(MANUAL_PARTS_DIR)) {
    const stem = path.parse(fileName).name;
    index.set(normalizeToken(stem), `/manual-parts/${fileName}`);
  }
  return index;
}

function findManualPhoto(imageIndex, reference) {
  const token = normalizeToken(reference);
  if (!token) return null;

  if (imageIndex.has(token)) return imageIndex.get(token);

  for (const [stemToken, photoPath] of imageIndex.entries()) {
    if (stemToken === token) return photoPath;
    if (stemToken.startsWith(token) || token.startsWith(stemToken)) return photoPath;
  }

  return null;
}

function makeRefEntry(reference, kind) {
  const cleanRef = asText(reference);
  const photoFromManual = findManualPhoto(imageIndex, cleanRef);

  let descricao = `Componente Plastimo REF ${cleanRef}`;
  let photoFallback = null;
  let categoria = 'MECÂNICA E SISTEMAS DE DISPARO';

  if (kind === 'cylinder') {
    descricao = `Cilindro CO2 Plastimo REF ${cleanRef}`;
    photoFallback = '/manual-parts-lr97/Cylinders.jpg';
  } else if (kind === 'valve') {
    descricao = `Válvula/Disco Plastimo REF ${cleanRef}`;
    photoFallback = '/manual-parts-lr97/valve.jpg';
  } else if (kind === 'protection') {
    descricao = `Proteção adesiva de válvula Plastimo REF ${cleanRef}`;
    photoFallback = '/manual-parts-lr97/Pack.jpg';
    categoria = 'MANUTENÇÃO E ETIQUETAGEM';
  }

  return {
    referencia: cleanRef,
    descricao,
    categoria,
    codigoFabricante: cleanRef,
    precoVenda: 0,
    foto: photoFromManual || photoFallback,
    associavelJangada: true,
    aplicavelMarcaJangada: 'PLASTIMO',
    aplicavelModeloJangada: PLASTIMO_MODELOS,
  };
}

function dedupeByReference(items) {
  const byRef = new Map();
  for (const item of items) {
    const key = asText(item.referencia).toUpperCase();
    if (!key) continue;
    if (!byRef.has(key)) {
      byRef.set(key, item);
      continue;
    }

    const current = byRef.get(key);
    if (!asText(current.foto) && asText(item.foto)) {
      byRef.set(key, item);
    }
  }

  return [...byRef.values()];
}

function chooseBestCandidate(candidates, targetCode, targetRef) {
  const code = asText(targetCode).toUpperCase();
  const ref = asText(targetRef).toUpperCase();
  const rows = [...candidates];

  rows.sort((a, b) => {
    const score = (row) => {
      let s = 0;
      const rowRef = asText(row.referencia).toUpperCase();
      const rowCode = asText(row.codigoFabricante).toUpperCase();
      const marca = asText(row.aplicavelMarcaJangada).toUpperCase();
      const desc = asText(row.descricao).toUpperCase();

      if (rowRef === ref) s += 1000;
      if (rowCode === code) s += 900;
      if (marca.includes('PLASTIMO')) s += 300;
      if (desc.includes('PLASTIMO')) s += 120;
      if (asText(row.foto)) s += 40;
      return s;
    };

    return score(b) - score(a);
  });

  return rows[0] || null;
}

const imageIndex = buildImageIndex();

async function main() {
  const genericPlastimoItems = [
    {
      referencia: 'VAL-PLASTIMO-RELIEF',
      descricao: 'Válvulas de Alívio Plastimo (250-350 mbar)',
      categoria: 'MECÂNICA E SISTEMAS DE DISPARO',
      codigoFabricante: 'PLASTIMO-RELIEF',
      precoVenda: 0,
      foto: '/manual-parts-lr97/valve.jpg',
      associavelJangada: true,
      aplicavelMarcaJangada: 'PLASTIMO',
      aplicavelModeloJangada: PLASTIMO_MODELOS,
    },
    {
      referencia: 'CYL-PLASTIMO-CO2',
      descricao: 'Cilindros CO2 Plastimo (família serviço)',
      categoria: 'MECÂNICA E SISTEMAS DE DISPARO',
      codigoFabricante: 'PLASTIMO-CO2',
      precoVenda: 0,
      foto: '/manual-parts-lr97/Cylinders.jpg',
      associavelJangada: true,
      aplicavelMarcaJangada: 'PLASTIMO',
      aplicavelModeloJangada: PLASTIMO_MODELOS,
    },
  ];

  const detailedItems = [
    ...CYLINDER_REFS.map((ref) => makeRefEntry(ref, 'cylinder')),
    ...VALVE_REFS.map((ref) => makeRefEntry(ref, 'valve')),
    ...PROTECTION_REFS.map((ref) => makeRefEntry(ref, 'protection')),
  ];

  const targetItems = dedupeByReference([...genericPlastimoItems, ...detailedItems]);

  let created = 0;
  let updated = 0;
  let photoAssigned = 0;
  let matchedByManufacturerCode = 0;

  for (const item of targetItems) {
    const ref = asText(item.referencia);
    const code = asText(item.codigoFabricante);
    const mustBeDistinctRef = STRICT_DISTINCT_REFS.has(ref.toUpperCase());

    const existingByRef = await prisma.stock.findUnique({ where: { referencia: ref } });
    let target = existingByRef;

    if (!target && code && !mustBeDistinctRef) {
      const candidates = await prisma.stock.findMany({
        where: { codigoFabricante: code },
        take: 25,
      });
      target = chooseBestCandidate(candidates, code, ref);
      if (target) matchedByManufacturerCode += 1;
    }

    const payload = {
      descricao: item.descricao,
      categoria: item.categoria,
      associavelJangada: true,
      aplicavelMarcaJangada: item.aplicavelMarcaJangada,
      aplicavelModeloJangada: item.aplicavelModeloJangada,
      codigoFabricante: code || null,
      precoVenda: Number(item.precoVenda ?? 0) || 0,
      foto: asText(item.foto) || null,
      estadoArtigo: 'ATIVO',
    };

    if (payload.foto) photoAssigned += 1;

    if (target) {
      await prisma.stock.update({
        where: { id: target.id },
        data: {
          ...payload,
          referencia: asText(target.referencia) === ref ? undefined : asText(target.referencia),
        },
      });
      updated += 1;
    } else {
      await prisma.stock.create({
        data: {
          referencia: ref,
          quantidade: 0,
          ...payload,
        },
      });
      created += 1;
    }
  }

  const duplicateReferences = await prisma.$queryRawUnsafe(`
    SELECT "referencia", COUNT(*)::int AS total
    FROM "Stock"
    WHERE "referencia" IS NOT NULL AND BTRIM("referencia") <> ''
    GROUP BY "referencia"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, "referencia" ASC
    LIMIT 20
  `);

  const duplicateManufacturerCodes = await prisma.$queryRawUnsafe(`
    SELECT "codigoFabricante", COUNT(*)::int AS total
    FROM "Stock"
    WHERE "codigoFabricante" IS NOT NULL AND BTRIM("codigoFabricante") <> ''
    GROUP BY "codigoFabricante"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, "codigoFabricante" ASC
    LIMIT 20
  `);

  const topPlastimo = await prisma.stock.findMany({
    where: {
      OR: [
        { aplicavelMarcaJangada: { contains: 'PLASTIMO' } },
        { descricao: { contains: 'Plastimo' } },
      ],
    },
    select: {
      referencia: true,
      descricao: true,
      codigoFabricante: true,
      foto: true,
    },
    orderBy: { referencia: 'asc' },
    take: 60,
  });

  console.log('=== Import Plastimo Stock ===');
  console.log(`Itens alvo: ${targetItems.length}`);
  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Associados por codigoFabricante: ${matchedByManufacturerCode}`);
  console.log(`Itens com foto definida no payload: ${photoAssigned}`);
  console.log(`Duplicados por referencia (top 20): ${duplicateReferences.length}`);
  console.log(`Duplicados por codigoFabricante (top 20): ${duplicateManufacturerCodes.length}`);
  console.log('Amostra Plastimo (até 60):');
  console.table(topPlastimo);

  if (duplicateReferences.length) {
    console.log('Top duplicados referencia:');
    console.table(duplicateReferences);
  }

  if (duplicateManufacturerCodes.length) {
    console.log('Top duplicados codigoFabricante:');
    console.table(duplicateManufacturerCodes);
  }
}

main()
  .catch((error) => {
    console.error('Erro no importador Plastimo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
