import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const action = await request.json();
    const { type, params } = action;

    let result;

    switch (type) {
      case 'listar_alertas':
        result = await listarAlertas();
        break;

      case 'buscar_jangada':
        result = await buscarJangada(params.numeroSerie || params.termo);
        break;

      case 'consultar_stock':
        result = await consultarStock(params.item);
        break;

      case 'calcular_testes_solas':
        result = await calcularTestesSOLAS(params.dataFabricacao);
        break;

      case 'listar_jangadas_vencimento':
        result = await listarJangadasProximasVencimento(params.dias || 90);
        break;

      case 'criar_agendamento':
        result = await criarAgendamento(params);
        break;

      case 'estatisticas_dashboard':
        result = await obterEstatisticas();
        break;

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida', type },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Erro ao executar ação:', error);
    return NextResponse.json(
      {
        error: 'Erro ao executar ação',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Action Handlers

async function listarAlertas() {
  const hoje = new Date();
  const em90Dias = new Date();
  em90Dias.setDate(em90Dias.getDate() + 90);

  const [jangadasVencimento, cilindrosExpirados, stockBaixo] = await Promise.all([
    // Jangadas próximas do vencimento
    prisma.jangada.findMany({
      where: {
        dataProximaInspecao: {
          lte: em90Dias,
          gte: hoje,
        },
      },
      select: {
        id: true,
        numeroSerie: true,
        tipo: true,
        dataProximaInspecao: true,
        cliente: {
          select: { nome: true },
        },
      },
      orderBy: { dataProximaInspecao: 'asc' },
      take: 10,
    }),

    // Cilindros expirados
    prisma.cilindro.findMany({
      where: {
        dataProximoTeste: {
          lt: hoje,
        },
      },
      select: {
        id: true,
        numeroSerie: true,
        dataProximoTeste: true,
      },
      take: 10,
    }),

    // Stock baixo
    prisma.stock.findMany({
      where: {
        quantidade: {
          lte: 5, // Usar valor fixo ao invés de referência de campo
        },
      },
      select: {
        id: true,
        nome: true,
        quantidade: true,
        quantidadeMinima: true,
      },
      take: 10,
    }),
  ]);

  return {
    jangadasVencimento: jangadasVencimento.length,
    cilindrosExpirados: cilindrosExpirados.length,
    stockBaixo: stockBaixo.length,
    detalhes: {
      jangadas: jangadasVencimento,
      cilindros: cilindrosExpirados,
      stock: stockBaixo,
    },
  };
}

async function buscarJangada(termo: string) {
  if (!termo) {
    return { error: 'Termo de busca não fornecido' };
  }

  const jangadas = await prisma.jangada.findMany({
    where: {
      OR: [
        { numeroSerie: { contains: termo, mode: 'insensitive' } },
        { tipo: { contains: termo, mode: 'insensitive' } },
      ],
    },
    include: {
      cliente: {
        select: { nome: true },
      },
      navio: {
        select: { nome: true },
      },
    },
    take: 5,
  });

  return { jangadas, total: jangadas.length };
}

async function consultarStock(item?: string) {
  const where = item
    ? {
        OR: [
          { nome: { contains: item, mode: 'insensitive' as const } },
          { categoria: { contains: item, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const items = await prisma.stock.findMany({
    where,
    orderBy: { quantidade: 'asc' },
    take: 20,
  });

  return { items, total: items.length };
}

async function calcularTestesSOLAS(dataFabricacao: string) {
  const dataFab = new Date(dataFabricacao);
  const hoje = new Date();
  const anosIdade = (hoje.getTime() - dataFab.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  const testes = [];

  // Sempre necessário
  testes.push({
    nome: 'Inspeção Visual',
    obrigatorio: true,
    frequencia: 'Anual',
  });

  // 5+ anos
  if (anosIdade >= 5) {
    testes.push({
      nome: 'Teste de Pressão',
      obrigatorio: true,
      frequencia: 'Anual a partir de 5 anos',
    });
  }

  // 10+ anos
  if (anosIdade >= 10) {
    testes.push(
      {
        nome: 'Full Service Test',
        obrigatorio: true,
        frequencia: 'Anual a partir de 10 anos',
      },
      {
        nome: 'Teste de Não-Acumulação de Pressão',
        obrigatorio: true,
        frequencia: 'Anual a partir de 10 anos',
      }
    );
  }

  return {
    anosIdade: Math.floor(anosIdade),
    testes,
    totalTestes: testes.length,
  };
}

async function listarJangadasProximasVencimento(dias: number) {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() + dias);

  const jangadas = await prisma.jangada.findMany({
    where: {
      dataProximaInspecao: {
        lte: dataLimite,
        gte: hoje,
      },
    },
    include: {
      cliente: {
        select: { nome: true },
      },
      navio: {
        select: { nome: true },
      },
    },
    orderBy: { dataProximaInspecao: 'asc' },
  });

  return { jangadas, total: jangadas.length };
}

async function criarAgendamento(params: any) {
  const agendamento = await prisma.agendamento.create({
    data: {
      titulo: params.titulo || 'Inspeção agendada pelo Julinho',
      descricao: params.descricao,
      dataInicio: new Date(params.data),
      dataFim: new Date(params.data),
      tipo: params.tipo || 'inspecao',
      status: 'agendado',
      jangadaId: params.jangadaId,
    },
  });

  return { agendamento };
}

async function obterEstatisticas() {
  const [
    totalJangadas,
    totalClientes,
    totalCilindros,
    obrasAbertas,
    agendamentosHoje,
  ] = await Promise.all([
    prisma.jangada.count(),
    prisma.cliente.count(),
    prisma.cilindro.count(),
    prisma.obra.count({ where: { status: 'EM_PROGRESSO' } }),
    prisma.agendamento.count({
      where: {
        dataInicio: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  return {
    totalJangadas,
    totalClientes,
    totalCilindros,
    obrasAbertas,
    agendamentosHoje,
  };
}
