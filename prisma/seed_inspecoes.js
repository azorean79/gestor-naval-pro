const { Client } = require('pg');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.gestornavalpro_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('No DATABASE_URL found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

async function seedInspecoes() {
  try {
    await client.connect();
    console.log('Connected to database');

    const naviosRes = await client.query('SELECT id, nome FROM "Navio" ORDER BY id ASC');
    const jangadasRes = await client.query('SELECT id, serial, "shipId", "shipNameManual" FROM "Jangada" ORDER BY id ASC');
    const stockRes = await client.query('SELECT id, referencia, descricao FROM "Stock" WHERE "associavelJangada" = true ORDER BY id ASC LIMIT 5');

    const navios = naviosRes.rows;
    const jangadas = jangadasRes.rows;
    const stockItems = stockRes.rows;

    if (jangadas.length === 0) {
      console.log('Nenhuma jangada encontrada para gerar inspeções.');
      return;
    }

    let createdOrUpdated = 0;
    let artigosUpserted = 0;

    for (let index = 0; index < jangadas.length; index++) {
      const jangada = jangadas[index];
      const linkedNavio = jangada.shipId ? navios.find((n) => n.id === jangada.shipId) : null;
      const navioNome = (linkedNavio && linkedNavio.nome) || jangada.shipNameManual || 'Sem navio';

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

      const upsertResult = await client.query(query + ' RETURNING id;', [
        certificadoNumero,
        navioNome,
        (linkedNavio && linkedNavio.id) || null,
        jangada.id,
        jangada.serial || null,
        dataInspecao,
        dataProxInspecao,
        status,
        'seed_inspecoes.js',
      ]);

      const inspecaoId = upsertResult.rows[0]?.id;
      if (inspecaoId && stockItems.length > 0) {
        for (let s = 0; s < stockItems.length; s++) {
          const stockItem = stockItems[s];
          const artigoQuery = `
            INSERT INTO "InspecaoArtigo" (
              "inspecaoId",
              "stockId",
              "referencia",
              "descricao",
              "quantidadePlaneada",
              "quantidadeUsada",
              "estado",
              "observacoes",
              "createdAt",
              "updatedAt"
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
            ON CONFLICT ("inspecaoId", "stockId") DO UPDATE SET
              "referencia" = EXCLUDED."referencia",
              "descricao" = EXCLUDED."descricao",
              "quantidadePlaneada" = EXCLUDED."quantidadePlaneada",
              "quantidadeUsada" = EXCLUDED."quantidadeUsada",
              "estado" = EXCLUDED."estado",
              "observacoes" = EXCLUDED."observacoes",
              "updatedAt" = NOW();
          `;
          await client.query(artigoQuery, [
            inspecaoId,
            stockItem.id,
            stockItem.referencia || `STK-${stockItem.id}`,
            stockItem.descricao || 'Artigo de inspeção',
            1,
            0,
            index % 4 === 0 ? 'Pendente' : 'Conforme',
            `Gerado automaticamente para inspeção ${certificadoNumero}`,
          ]);
          artigosUpserted += 1;
        }
      }

      createdOrUpdated += 1;
    }

    console.log(`Inspeções seeded: ${createdOrUpdated}`);
    console.log(`Artigos de inspeção seeded: ${artigosUpserted}`);
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

module.exports = { seedInspecoes };
