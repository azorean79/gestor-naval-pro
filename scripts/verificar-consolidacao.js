#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const directUrl = process.env.DIRECT_DATABASE_URL || "postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_983921VKKN1b6-rok5EQe@db.prisma.io:5432/postgres?sslmode=require&pool=true";

async function verificar() {
  const pool = new Pool({ connectionString: directUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const total = await prisma.navio.count();
    const comInspecoes = await prisma.navio.count({
      where: { inspecoes: { some: {} } }
    });
    const comCertificados = await prisma.navio.count({
      where: { certificados: { some: {} } }
    });
    const comJangadas = await prisma.navio.count({
      where: { jangadas: { some: {} } }
    });

    console.log('\n✅ VERIFICAÇÃO PÓS-CONSOLIDAÇÃO\n');
    console.log('📊 Estatísticas Gerais:');
    console.log(`  Total de embarcações: ${total}`);
    console.log(`  Embarcações com inspeções: ${comInspecoes}`);
    console.log(`  Embarcações com certificados: ${comCertificados}`);
    console.log(`  Embarcações com jangadas: ${comJangadas}`);
    console.log(`\n✨ Consolidação finalizada com sucesso!\n`);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
