import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'geral';
    const periodoInicio = searchParams.get('periodoInicio');
    const periodoFim = searchParams.get('periodoFim');

    const wherePeriodo: any = {};
    if (periodoInicio && periodoFim) {
      wherePeriodo.createdAt = {
        gte: new Date(periodoInicio),
        lte: new Date(periodoFim),
      };
    }

    let analytics = {};

    switch (tipo) {
      case 'clientes':
        analytics = await getClientesAnalytics(wherePeriodo);
        break;
      case 'equipamentos':
        analytics = await getEquipamentosAnalytics(wherePeriodo);
        break;
      case 'financeiro':
        analytics = await getFinanceiroAnalytics(wherePeriodo);
        break;
      case 'manutencao':
        analytics = await getManutencaoAnalytics(wherePeriodo);
        break;
      default:
        analytics = await getGeralAnalytics(wherePeriodo);
    }

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function getGeralAnalytics(wherePeriodo: any) {
  const [
    totalClientes,
    totalNavios,
    totalJangadas,
    totalCilindros,
    faturasPendentes,
    agendamentosAtivos,
    notificacoesNaoLidas,
  ] = await Promise.all([
    prisma.cliente.count({ where: wherePeriodo }),
    prisma.navio.count({ where: wherePeriodo }),
    prisma.jangada.count({ where: wherePeriodo }),
    prisma.cilindro.count({ where: wherePeriodo }),
    prisma.fatura.count({ where: { ...wherePeriodo, status: 'pendente' } }),
    prisma.agendamento.count({ where: { ...wherePeriodo, status: 'agendado' } }),
    prisma.notificacao.count({ where: { ...wherePeriodo, lida: false } }),
  ]);

  return {
    totalClientes,
    totalNavios,
    totalJangadas,
    totalCilindros,
    faturasPendentes,
    agendamentosAtivos,
    notificacoesNaoLidas,
  };
}

async function getClientesAnalytics(wherePeriodo: any) {
  const clientesPorDelegacao = await prisma.cliente.groupBy({
    by: ['delegacao'],
    _count: { id: true },
    where: wherePeriodo,
  });

  const clientesPorTecnico = await prisma.cliente.groupBy({
    by: ['tecnico'],
    _count: { id: true },
    where: wherePeriodo,
  });

  return {
    clientesPorDelegacao,
    clientesPorTecnico,
  };
}

async function getEquipamentosAnalytics(wherePeriodo: any) {
  const naviosPorStatus = await prisma.navio.groupBy({
    by: ['status'],
    _count: { id: true },
    where: wherePeriodo,
  });

  const jangadasPorStatus = await prisma.jangada.groupBy({
    by: ['status'],
    _count: { id: true },
    where: wherePeriodo,
  });

  const cilindrosPorStatus = await prisma.cilindro.groupBy({
    by: ['status'],
    _count: { id: true },
    where: wherePeriodo,
  });

  return {
    naviosPorStatus,
    jangadasPorStatus,
    cilindrosPorStatus,
  };
}

async function getFinanceiroAnalytics(wherePeriodo: any) {
  const faturasPorStatus = await prisma.fatura.groupBy({
    by: ['status'],
    _sum: { valor: true },
    _count: { id: true },
    where: wherePeriodo,
  });

  const receitaTotal = await prisma.fatura.aggregate({
    where: { ...wherePeriodo, status: 'paga' },
    _sum: { valor: true },
  });

  return {
    faturasPorStatus,
    receitaTotal: receitaTotal._sum.valor || 0,
  };
}

async function getManutencaoAnalytics(wherePeriodo: any) {
  const agendamentosPorTipo = await prisma.agendamento.groupBy({
    by: ['tipo'],
    _count: { id: true },
    where: wherePeriodo,
  });

  const agendamentosPorStatus = await prisma.agendamento.groupBy({
    by: ['status'],
    _count: { id: true },
    where: wherePeriodo,
  });

  const obrasPorStatus = await prisma.obra.groupBy({
    by: ['status'],
    _count: { id: true },
    where: wherePeriodo,
  });

  return {
    agendamentosPorTipo,
    agendamentosPorStatus,
    obrasPorStatus,
  };
}
