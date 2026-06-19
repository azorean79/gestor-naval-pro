import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? process.env.gestornavalpro_DATABASE_URL ?? process.env.GESTOR_DB;
if (!connectionString) {
  console.error('No database connection string found. Set DIRECT_URL or DATABASE_URL in .env.local');
  process.exit(1);
}

// Use standard PrismaClient and explicitly set datasource URL to avoid adapter conflicts
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function main() {
  // Buscar todas as jangadas do DB
  const rows = await prisma.jangada.findMany({
    select: {
      serial: true,
      shipNameManual: true,
      packType: true,
      artigos: true,
    },
    orderBy: { serial: 'asc' },
  });

  // Deduplicação por serial, mesclando campos e artigos
  const map = new Map<string, any>();
  for (const r of rows) {
    const serial = String(r.serial ?? '').trim();
    if (!serial) continue;
    const existing = map.get(serial) || { serial, navio: '', packType: '', artigos: [] };
    // Preferir valores não vazios
    const navio = existing.navio || (r.shipNameManual ?? '') || '';
    const packType = existing.packType || (r.packType ?? '') || '';
    // juntar artigos (armazenados como JSON string no DB)
    let aExisting: any[] = [];
    try { aExisting = Array.isArray(existing.artigos) ? existing.artigos : (existing.artigos ? JSON.parse(existing.artigos) : []); } catch { aExisting = existing.artigos || []; }
    let aNew: any[] = [];
    try { aNew = r.artigos ? JSON.parse(r.artigos) : []; } catch { aNew = []; }
    const combined: any[] = [];
    const seen = new Set<string>();
    for (const it of aExisting.concat(aNew)) {
      const key = (it && (it.item ?? JSON.stringify(it)))?.toString() ?? JSON.stringify(it);
      if (!seen.has(key)) { seen.add(key); combined.push(it); }
    }
    map.set(serial, { serial, navio, packType, artigos: combined });
  }

  const uniques = Array.from(map.values()).sort((a, b) => (a.serial > b.serial ? 1 : -1));
  const header = ['num','serial','navio','packType','artigos_count','artigos_json'];
  const lines = [header.join(';')];
  for (let i = 0; i < uniques.length; i++) {
    const u = uniques[i];
    const artigosJson = JSON.stringify(u.artigos || []);
    lines.push([i+1, u.serial ?? '', u.navio ?? '', u.packType ?? '', (u.artigos||[]).length, artigosJson].join(';'));
  }
  const out = 'scripts/jangadas_lista_completa.csv';
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  console.log('Exportação concluída para', out, 'registos:', uniques.length);
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
