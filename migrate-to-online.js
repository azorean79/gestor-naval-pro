const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Configuração dos bancos
const sqliteDb = new PrismaClient({
  datasourceUrl: 'file:./dev.db'
});

const postgresDb = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function migrateData() {
  try {
    console.log('🚀 Iniciando migração de dados...');

    // 1. Migrar Clientes
    console.log('📋 Migrando clientes...');
    const clientes = await sqliteDb.cliente.findMany();
    for (const cliente of clientes) {
      await postgresDb.cliente.create({ data: cliente });
    }
    console.log(`✅ ${clientes.length} clientes migrados`);

    // 2. Migrar Navios
    console.log('🚢 Migrando navios...');
    const navios = await sqliteDb.navio.findMany();
    for (const navio of navios) {
      await postgresDb.navio.create({ data: navio });
    }
    console.log(`✅ ${navios.length} navios migrados`);

    // 3. Migrar Jangadas
    console.log('🛟 Migrando jangadas...');
    const jangadas = await sqliteDb.jangada.findMany();
    for (const jangada of jangadas) {
      await postgresDb.jangada.create({ data: jangada });
    }
    console.log(`✅ ${jangadas.length} jangadas migradas`);

    // 4. Migrar Cilindros
    console.log('🔧 Migrando cilindros...');
    const cilindros = await sqliteDb.cilindro.findMany();
    for (const cilindro of cilindros) {
      await postgresDb.cilindro.create({ data: cilindro });
    }
    console.log(`✅ ${cilindros.length} cilindros migrados`);

    // 5. Migrar Stock
    console.log('📦 Migrando stock...');
    const stocks = await sqliteDb.stock.findMany();
    for (const stock of stocks) {
      await postgresDb.stock.create({ data: stock });
    }
    console.log(`✅ ${stocks.length} items de stock migrados`);

    // 6. Migrar Agendamentos
    console.log('📅 Migrando agendamentos...');
    const agendamentos = await sqliteDb.agendamento.findMany();
    for (const agendamento of agendamentos) {
      await postgresDb.agendamento.create({ data: agendamento });
    }
    console.log(`✅ ${agendamentos.length} agendamentos migrados`);

    // 7. Migrar Faturas
    console.log('💰 Migrando faturas...');
    const faturas = await sqliteDb.fatura.findMany();
    for (const fatura of faturas) {
      await postgresDb.fatura.create({ data: fatura });
    }
    console.log(`✅ ${faturas.length} faturas migradas`);

    // 8. Migrar Obras
    console.log('🏗️ Migrando obras...');
    const obras = await sqliteDb.obra.findMany();
    for (const obra of obras) {
      await postgresDb.obra.create({ data: obra });
    }
    console.log(`✅ ${obras.length} obras migradas`);

    // 9. Migrar Movimentações de Stock
    console.log('📊 Migrando movimentações de stock...');
    const movimentacoes = await sqliteDb.movimentacaoStock.findMany();
    for (const movimentacao of movimentacoes) {
      await postgresDb.movimentacaoStock.create({ data: movimentacao });
    }
    console.log(`✅ ${movimentacoes.length} movimentações migradas`);

    // 10. Migrar Transportes
    console.log('🚛 Migrando transportes...');
    const transportes = await sqliteDb.transporte.findMany();
    for (const transporte of transportes) {
      await postgresDb.transporte.create({ data: transporte });
    }
    console.log(`✅ ${transportes.length} transportes migrados`);

    // 11. Migrar Notificações
    console.log('🔔 Migrando notificações...');
    const notificacoes = await sqliteDb.notificacao.findMany();
    for (const notificacao of notificacoes) {
      await postgresDb.notificacao.create({ data: notificacao });
    }
    console.log(`✅ ${notificacoes.length} notificações migradas`);

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await sqliteDb.$disconnect();
    await postgresDb.$disconnect();
  }
}

// Executar migração apenas se o script for chamado diretamente
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };