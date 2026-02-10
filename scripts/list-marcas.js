const path = require('path');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Load env variables
function loadEnvFile(filePath) {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

async function main() {
  try {
    const marcas = await prisma.marcaJangada.findMany({
      select: {
        id: true,
        nome: true,
        ativo: true,
        createdAt: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    console.log('\n=== MARCAS JANGADA ===\n')
    if (marcas.length === 0) {
      console.log('Nenhuma marca criada ainda.')
    } else {
      marcas.forEach((marca, index) => {
        console.log(`${index + 1}. ${marca.nome}`)
        console.log(`   ID: ${marca.id}`)
        console.log(`   Status: ${marca.ativo ? '✅ Ativa' : '❌ Inativa'}`)
        console.log(`   Criada: ${new Date(marca.createdAt).toLocaleString('pt-PT')}`)
        console.log('')
      })
    }

    console.log(`\nTotal: ${marcas.length} marca(s)`)
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(console.error)
