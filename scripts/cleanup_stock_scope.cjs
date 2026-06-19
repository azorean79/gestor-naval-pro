const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isWithinScope(item) {
  if (item.associavelJangada) return true;

  const marca = normalize(item.aplicavelMarcaJangada);
  const codigoFabricante = String(item.codigoFabricante || '').trim();

  return marca.includes('ocean safety') && codigoFabricante.length > 0;
}

async function main() {
  const applyMode = process.argv.includes('--apply');

  const rows = await prisma.stock.findMany({
    select: {
      id: true,
      referencia: true,
      descricao: true,
      associavelJangada: true,
      aplicavelMarcaJangada: true,
      codigoFabricante: true,
      quantidade: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  });

  const keep = rows.filter(isWithinScope);
  const toDelete = rows.filter((row) => !isWithinScope(row));

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const backupDir = path.join(process.cwd(), 'scripts', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `stock_cleanup_out_of_scope_${stamp}.json`);

  const payload = {
    generatedAt: now.toISOString(),
    mode: applyMode ? 'apply' : 'dry-run',
    rule: 'Keep associavelJangada=true OR (aplicavelMarcaJangada contains Ocean Safety AND codigoFabricante non-empty)',
    totals: {
      total: rows.length,
      kept: keep.length,
      outOfScope: toDelete.length,
    },
    outOfScope: toDelete,
  };

  fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Total stock: ${rows.length}`);
  console.log(`Mantidos no escopo: ${keep.length}`);
  console.log(`Fora do escopo: ${toDelete.length}`);
  console.log(`Backup: ${backupFile}`);

  if (!applyMode) {
    console.log('DRY-RUN concluído. Para aplicar eliminação, execute com --apply.');
    return;
  }

  if (toDelete.length === 0) {
    console.log('Nada para eliminar.');
    return;
  }

  const ids = toDelete.map((row) => row.id);
  const chunkSize = 500;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const result = await prisma.stock.deleteMany({ where: { id: { in: chunk } } });
    deleted += Number(result.count || 0);
  }

  console.log(`Eliminados: ${deleted}`);
}

main()
  .catch((error) => {
    console.error('Erro no cleanup de stock:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
