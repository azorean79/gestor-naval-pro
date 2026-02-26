const { Client } = require('pg');

async function main() {
  const id = process.argv[2] || 'CIL-001';
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('ERRO: DATABASE_URL não definida em env.');
    process.exit(2);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM cilindros WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) {
      console.log('NOT_FOUND');
      process.exit(0);
    }
    const row = res.rows[0];
    const issues = [];
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (typeof v === 'string' && v.length) {
        let hasEllipsis = v.indexOf('\u2026') !== -1;
        let highChars = [];
        for (let i = 0; i < v.length; i++) {
          const cp = v.charCodeAt(i);
          if (cp > 255) highChars.push({ index: i, code: cp, char: v[i] });
        }
        if (hasEllipsis || highChars.length) {
          issues.push({ column: k, length: v.length, sample: v.slice(0,200), hasEllipsis, highCharsCount: highChars.length, highChars: highChars.slice(0,5) });
        }
      }
    }
    console.log(JSON.stringify({ found: true, issues, rowPreview: Object.fromEntries(Object.keys(row).slice(0,10).map(k=>[k, typeof row[k] === 'string' ? row[k].slice(0,200) : row[k]])) }, null, 2));
  } catch (err) {
    console.error('ERROR', String(err));
    process.exit(3);
  } finally {
    try { await client.end(); } catch(e){}
  }
}

main();
