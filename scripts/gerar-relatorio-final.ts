import { prisma } from '../src/lib/prisma';

async function gerarRelatorioFinal() {
  // Buscar notificações recentes
  const notificacoes = await prisma.notificacao.findMany({
    orderBy: { dataEnvio: 'desc' },
    take: 100,
  });

  // Buscar divergências de componentes
  const divergencias = await prisma.notificacao.findMany({
    where: { tipo: 'warning' },
    orderBy: { dataEnvio: 'desc' },
    take: 100,
  });

  // Buscar componentes vencidos e próximos do vencimento
  const vencidos = await prisma.notificacao.findMany({
    where: { titulo: { contains: 'vencido' } },
    orderBy: { dataEnvio: 'desc' },
    take: 100,
  });
  const proximos = await prisma.notificacao.findMany({
    where: { titulo: { contains: 'próximo do vencimento' } },
    orderBy: { dataEnvio: 'desc' },
    take: 100,
  });

  // Montar relatório
  const relatorio = {
    dataGeracao: new Date(),
    totalNotificacoes: notificacoes.length,
    totalDivergencias: divergencias.length,
    totalVencidos: vencidos.length,
    totalProximos: proximos.length,
    detalhes: {
      notificacoes,
      divergencias,
      vencidos,
      proximos,
    },
  };

  // Salvar relatório em arquivo JSON
  const fs = require('fs');
  fs.writeFileSync('relatorio-final.json', JSON.stringify(relatorio, null, 2), 'utf-8');
  console.log('Relatório final gerado em relatorio-final.json');
}

gerarRelatorioFinal().catch(console.error);
