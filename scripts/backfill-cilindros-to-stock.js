const { Client } = require('pg');

function sanitizeString(value) {
  if (value == null) return value;
  try {
    return String(value).normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return String(value).replace(/\u2026/g, '...');
  }
}

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('ERRO: DATABASE_URL não definida em env.');
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();

    const r = await client.query('SELECT id, "numeroSerie", localizacao, observacoes, status FROM "cilindros" ORDER BY "createdAt" DESC');
    const rows = r.rows || [];
    console.log(`Encontrados ${rows.length} cilindros.`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    let errorCount = 0;
    for (const [i, c] of rows.entries()) {
      const numero = c.numeroSerie || null;
      if (!numero) {
        skipped++;
        console.warn(`Skipping cilindro id=${c.id} (no numeroSerie)`);
        continue;
      }

      const codigo = sanitizeString(numero);
      const nome = sanitizeString(`Cilindro ${codigo}`);
      const categoria = 'Cilindros';
      const unidade = 'unidade';
      const quantidadeAtual = 1;
      const quantidadeMinima = 0;
      const descricao = sanitizeString(c.observacoes) || `Cilindro série ${codigo}`;
      const observacoes = sanitizeString(c.observacoes) || null;
      const localizacao = sanitizeString(c.localizacao) || null;

      const sql = `
        INSERT INTO "item_stock" ("codigo","nome","categoria","unidade","quantidadeAtual","quantidadeMinima","descricao","localizacao","observacoes","createdAt","updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())
        ON CONFLICT ("codigo") DO UPDATE SET
          "nome" = EXCLUDED."nome",
          "descricao" = EXCLUDED."descricao",
          "localizacao" = EXCLUDED."localizacao",
          "observacoes" = EXCLUDED."observacoes",
          "updatedAt" = now()
        RETURNING (xmax = 0) AS inserted;
      `;

      try {
        if (process.env.BACKFILL_VERBOSE) {
          console.log(`Upserting [${i + 1}/${rows.length}] codigo=${codigo} id=${c.id} params=`, { codigo, nome, categoria, unidade, quantidadeAtual, quantidadeMinima, descricao, localizacao, observacoes });
        }
        const res = await client.query(sql, [codigo, nome, categoria, unidade, quantidadeAtual, quantidadeMinima, descricao, localizacao, observacoes]);
        const inserted = res.rows && res.rows[0] && res.rows[0].inserted;
        if (inserted) created++; else updated++;
      } catch (e) {
        errorCount++;
        console.error(`Erro ao upsert item_stock para codigo=${codigo} id=${c.id} (row ${i + 1}):`, e && e.stack ? e.stack : e);
        console.error('Row data:', JSON.stringify({ id: c.id, numeroSerie: c.numeroSerie, localizacao: c.localizacao, observacoes: c.observacoes, status: c.status }));
      }
    }

    console.log(`Backfill completo. created=${created} updated=${updated} skipped=${skipped} errors=${errorCount}`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.stack ? err.stack : String(err));
    try { await client.end(); } catch(e){}
    process.exit(3);
  }
}

main();
