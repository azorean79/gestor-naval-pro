const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function chooseCanonical(group) {
  const withNumero = group.find((item) => String(item.numeroCliente || '').trim());
  if (withNumero) return withNumero;

  const withEmail = group.find((item) => String(item.email || '').trim());
  if (withEmail) return withEmail;

  return [...group].sort((a, b) => Number(a.id) - Number(b.id))[0];
}

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('DATABASE_URL (ou POSTGRES_URL) não encontrado em .env/.env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? true : undefined,
  });

  await client.connect();

  const result = await client.query(
    'SELECT id, nome, "numeroCliente", email, telefone, telmovel, ilha FROM "Cliente" ORDER BY id ASC'
  );

  await client.end();

  const byNormalized = new Map();
  for (const row of result.rows) {
    const normalized = normalizeName(row.nome);
    if (!normalized) continue;
    if (!byNormalized.has(normalized)) byNormalized.set(normalized, []);
    byNormalized.get(normalized).push(row);
  }

  const duplicateGroups = [];
  for (const [normalized, group] of byNormalized.entries()) {
    if (group.length < 2) continue;

    const canonical = chooseCanonical(group);
    duplicateGroups.push({
      normalized,
      total: group.length,
      canonicalId: canonical.id,
      canonicalName: canonical.nome,
      clientes: group.map((item) => ({
        id: item.id,
        nome: item.nome,
        numeroCliente: item.numeroCliente || null,
        email: item.email || null,
        telefone: item.telefone || null,
        telmovel: item.telmovel || null,
        ilha: item.ilha || null,
      })),
    });
  }

  duplicateGroups.sort((a, b) => b.total - a.total || a.normalized.localeCompare(b.normalized));

  const report = {
    generatedAt: new Date().toISOString(),
    totalClientes: result.rows.length,
    duplicateGroups: duplicateGroups.length,
    duplicates: duplicateGroups,
  };

  const reportPath = path.join(process.cwd(), 'scripts', 'duplicate_clientes_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Total clientes: ${report.totalClientes}`);
  console.log(`Grupos duplicados: ${report.duplicateGroups}`);
  console.log(`Relatório: ${reportPath}`);

  if (!duplicateGroups.length) {
    console.log('Nenhum duplicado encontrado.');
    return;
  }

  console.log('--- DUPLICADOS ---');
  for (const group of duplicateGroups) {
    const names = group.clientes.map((c) => `${c.id}:${c.nome}`).join(' | ');
    console.log(`[${group.normalized}] => ${names}`);
  }
}

main().catch((error) => {
  console.error('Erro ao gerar relatório de duplicados de clientes:', error.message);
  process.exit(1);
});
