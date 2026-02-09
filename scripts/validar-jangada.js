// scripts/validar-jangada.js
// Script Node.js para validar componentes de uma jangada

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const numeroSerie = process.argv[2];

async function validarJangada(numeroSerie) {
  if (!numeroSerie) {
    console.error('Informe o número de série da jangada.');
    process.exit(1);
  }
  const jangada = await prisma.jangada.findFirst({ where: { numeroSerie: { contains: numeroSerie } } });
  if (!jangada) {
    console.log('Jangada não encontrada:', numeroSerie);
    process.exit(0);
  }
  const componentes = await prisma.inspecaoComponente.findMany({ where: { jangadaId: jangada.id } });
  if (componentes.length === 0) {
    console.log('Nenhum componente registrado para a jangada:', numeroSerie);
    process.exit(0);
  }
  console.log(`Componentes da jangada ${numeroSerie}:`);
  for (const c of componentes) {
    let status = 'OK';
    if (c.validade) {
      const dias = Math.ceil((new Date(c.validade) - new Date()) / (1000 * 60 * 60 * 24));
      if (dias < 0) status = 'EXPIRADO';
      else if (dias < 365) status = 'ALERTA';
    }
    console.log(`- ${c.nome} | Qtde: ${c.quantidade} | Estado: ${c.estado} | Validade: ${c.validade ? c.validade.toISOString().split('T')[0] : 'N/A'} | Status: ${status}`);
  }
  await prisma.$disconnect();
}

validarJangada(numeroSerie);