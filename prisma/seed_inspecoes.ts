import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.gestornavalpro_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('No DATABASE_URL found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

type Navio = { id: number; nome: string };
type Jangada = { id: number; serial: string; shipId: number | null; shipNameManual: string | null };

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function seedInspecoes() {
  try {
    await client.connect();
    console.log('Connected to database');

    const naviosRes = await client.query<Navio>('SELECT id, nome FROM "Navio" ORDER BY id ASC');
    const jangadasRes = await client.query<Jangada>('SELECT id, serial, "shipId", "shipNameManual" FROM "Jangada" ORDER BY id ASC');

    const navios = naviosRes.rows;
    const jangadas = jangadasRes.rows;

    if (jangadas.length === 0) {
      console.log('Nenhuma jangada encontrada para gerar inspeções.');
      return;
    }

    let createdOrUpdated = 0;

    for (let index = 0; index < jangadas.length; index++) {
      const jangada = jangadas[index];
      const linkedNavio = jangada.shipId ? navios.find((n) => n.id === jangada.shipId) : null;
      const navioNome = linkedNavio?.nome || jangada.shipNameManual || 'Sem navio';

      const baseDate = addMonths(new Date(), -(index % 8));
      const dataInspecao = toIsoDate(baseDate);
      const dataProxInspecao = toIsoDate(addMonths(baseDate, 12));
      const certificadoNumero = `AUTO-${String(jangada.serial || jangada.id).replace(/\s+/g, '').toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
      const status = index % 4 === 0 ? 'Pendente' : 'Concluída';

      const query = `
        INSERT INTO "Inspecao" (
          "certificadoNumero",
          "navioNome",
          "navioId",
          "jangadaId",
          "jangadaSerial",
          "dataInspecao",
          "dataProxInspecao",
          "status",
          "sourceFile",
          "createdAt",
          "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
        ON CONFLICT ("certificadoNumero") DO UPDATE SET
          "navioNome" = EXCLUDED."navioNome",
          "navioId" = EXCLUDED."navioId",
          "jangadaId" = EXCLUDED."jangadaId",
          "jangadaSerial" = EXCLUDED."jangadaSerial",
          "dataInspecao" = EXCLUDED."dataInspecao",
          "dataProxInspecao" = EXCLUDED."dataProxInspecao",
          "status" = EXCLUDED."status",
          "sourceFile" = EXCLUDED."sourceFile",
          "updatedAt" = NOW();
      `;

      await client.query(query, [
        certificadoNumero,
        navioNome,
        linkedNavio?.id ?? null,
        jangada.id,
        jangada.serial || null,
        dataInspecao,
        dataProxInspecao,
        status,
        'seed_inspecoes.ts',
      ]);

      createdOrUpdated += 1;
    }

    console.log(`Inspeções seeded: ${createdOrUpdated}`);
  } catch (error) {
    console.error('Error seeding inspections:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedInspecoes();
}

export { seedInspecoes };
