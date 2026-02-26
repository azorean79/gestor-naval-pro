const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Script para migrar dados do SQLite para PostgreSQL Online
async function migrateToOnlineDatabase() {
  console.log(' Iniciando migração para banco de dados online...');

  // Conectar ao banco SQLite local
  const sqliteClient = new PrismaClient({
    datasourceUrl: 'file:./dev.db'
  });

  // Conectar ao banco PostgreSQL online (usará DATABASE_URL do .env)
  const postgresClient = new PrismaClient();

  try {
    console.log(' Exportando dados do SQLite...');

    // Buscar todos os dados
    const clientes = await sqliteClient.cliente.findMany({ include: { navios: true, jangadas: true } });
    const navios = await sqliteClient.navio.findMany({ include: { jangadas: true } });
    const jangadas = await sqliteClient.jangada.findMany({ include: { componentes: true } });
    const cilindros = await sqliteClient.cilindro.findMany();
    const agendamentos = await sqliteClient.agendamento.findMany();
    const faturas = await sqliteClient.fatura.findMany();
    const notificacoes = await sqliteClient.notificacao.findMany();
    const obras = await sqliteClient.obra.findMany();
    const predictiveMaintenances = await sqliteClient.predictiveMaintenance.findMany();
    const stock = await sqliteClient.stock.findMany();
    const users = await sqliteClient.user.findMany();

    console.log( Dados exportados:  clientes,  navios,  jangadas);

    console.log('  Importando dados para PostgreSQL online...');

    // Limpar dados existentes no PostgreSQL (opcional)
    console.log(' Limpando dados existentes...');
    await postgresClient.stock.deleteMany();
    await postgresClient.predictiveMaintenance.deleteMany();
    await postgresClient.obra.deleteMany();
    await postgresClient.notificacao.deleteMany();
    await postgresClient.fatura.deleteMany();
    await postgresClient.agendamento.deleteMany();
    await postgresClient.cilindro.deleteMany();
    await postgresClient.jangada.deleteMany();
    await postgresClient.navio.deleteMany();
    await postgresClient.cliente.deleteMany();
    await postgresClient.user.deleteMany();

    // Importar usuários
    if (users.length > 0) {
      console.log( Importando  usuários...);
      await postgresClient.user.createMany({ data: users });
    }

    // Importar clientes
    if (clientes.length > 0) {
      console.log( Importando  clientes...);
      for (const cliente of clientes) {
        const { navios: _, jangadas: __, ...clienteData } = cliente;
        await postgresClient.cliente.create({ data: clienteData });
      }
    }

    // Importar navios
    if (navios.length > 0) {
      console.log( Importando  navios...);
      for (const navio of navios) {
        const { jangadas: _, ...navioData } = navio;
        await postgresClient.navio.create({ data: navioData });
      }
    }

    // Importar jangadas
    if (jangadas.length > 0) {
      console.log( Importando  jangadas...);
      for (const jangada of jangadas) {
        const { componentes: _, ...jangadaData } = jangada;
        await postgresClient.jangada.create({ data: jangadaData });
      }
    }

    // Importar cilindros
    if (cilindros.length > 0) {
      console.log( Importando  cilindros...);
      await postgresClient.cilindro.createMany({ data: cilindros });
    }

    // Importar agendamentos
    if (agendamentos.length > 0) {
      console.log( Importando  agendamentos...);
      await postgresClient.agendamento.createMany({ data: agendamentos });
    }

    // Importar faturas
    if (faturas.length > 0) {
      console.log( Importando  faturas...);
      await postgresClient.fatura.createMany({ data: faturas });
    }

    // Importar notificações
    if (notificacoes.length > 0) {
      console.log( Importando  notificações...);
      await postgresClient.notificacao.createMany({ data: notificacoes });
    }

    // Importar obras
    if (obras.length > 0) {
      console.log( Importando  obras...);
      await postgresClient.obra.createMany({ data: obras });
    }

    // Importar manutenções preditivas
    if (predictiveMaintenances.length > 0) {
      console.log( Importando  manutenções preditivas...);
      await postgresClient.predictiveMaintenance.createMany({ data: predictiveMaintenances });
    }

    // Importar stock
    if (stock.length > 0) {
      console.log( Importando  itens de stock...);
      await postgresClient.stock.createMany({ data: stock });
    }

    console.log(' Migração concluída com sucesso!');
    console.log(' Seu banco de dados online está pronto para uso.');

  } catch (error) {
    console.error(' Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await sqliteClient.\();
    await postgresClient.\();
  }
}

migrateToOnlineDatabase();
