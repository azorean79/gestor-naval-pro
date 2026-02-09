const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function limparBaseDados() {
  console.log('🧹 LIMPANDO TODOS OS DADOS DA BASE DE DADOS...');

  try {
    // Desabilitar foreign key checks temporariamente
    await prisma.$executeRaw`SET session_replication_role = 'replica';`;

    // Deletar em ordem reversa das dependências
    console.log('🗑️  Removendo notificações...');
    await prisma.notificacao.deleteMany();

    console.log('🗑️  Removendo envios...');
    await prisma.envio.deleteMany();

    console.log('🗑️  Removendo tarefas...');
    await prisma.tarefa.deleteMany();

    console.log('🗑️  Removendo obras...');
    await prisma.obra.deleteMany();

    console.log('🗑️  Removendo inspeções de componentes...');
    await prisma.inspecaoComponente.deleteMany();

    console.log('🗑️  Removendo inspeções...');
    await prisma.inspecao.deleteMany();

    console.log('🗑️  Removendo faturas...');
    await prisma.fatura.deleteMany();

    console.log('🗑️  Removendo certificados...');
    await prisma.certificado.deleteMany();

    console.log('🗑️  Removendo agendamentos...');
    await prisma.agendamento.deleteMany();

    console.log('🗑️  Removendo jangadas...');
    await prisma.jangada.deleteMany();

    console.log('🗑️  Removendo navios...');
    await prisma.navio.deleteMany();

    console.log('🗑️  Removendo clientes...');
    await prisma.cliente.deleteMany();

    console.log('🗑️  Removendo itens de stock...');
    await prisma.stock.deleteMany();

    console.log('🗑️  Removendo tipos de pack...');
    await prisma.tipoPack.deleteMany();

    console.log('🗑️  Removendo lotações...');
    await prisma.lotacaoJangada.deleteMany();

    console.log('🗑️  Removendo modelos...');
    await prisma.modeloJangada.deleteMany();

    console.log('🗑️  Removendo marcas...');
    await prisma.marcaJangada.deleteMany();

    // Reabilitar foreign key checks
    await prisma.$executeRaw`SET session_replication_role = 'origin';`;

    console.log('✅ BASE DE DADOS COMPLETAMENTE LIMPA!');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

limparBaseDados()
  .catch((e) => {
    console.error('❌ Erro fatal:', e);
    process.exit(1);
  });