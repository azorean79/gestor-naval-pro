import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint para sistema de lembretes automáticos
 * Pode ser chamado via cron job (ex: Vercel Cron, GitHub Actions)
 */
export async function POST(request: NextRequest) {
  try {
    const { tipo } = await request.json();

    let resultado;

    switch (tipo) {
      case 'agendamentos':
        resultado = await enviarLembretesAgendamentos();
        break;
      case 'jangadas_vencimento':
        resultado = await enviarLembretesJangadas();
        break;
      case 'relatorio_semanal':
        resultado = await gerarRelatorioSemanal();
        break;
      case 'todos':
        const [agendamentos, jangadas, relatorio] = await Promise.all([
          enviarLembretesAgendamentos(),
          enviarLembretesJangadas(),
          gerarRelatorioSemanal(),
        ]);
        resultado = { agendamentos, jangadas, relatorio };
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de lembrete inválido' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      tipo,
      resultado,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao processar lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao processar lembretes', details: error.message },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    lembretes_disponiveis: [
      'agendamentos',
      'jangadas_vencimento',
      'relatorio_semanal',
      'todos',
    ],
    info: 'Use POST com { "tipo": "agendamentos" } para enviar lembretes',
  });
}

async function enviarLembretesAgendamentos() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const em3Dias = new Date(hoje);
  em3Dias.setDate(em3Dias.getDate() + 3);

  // Agendamentos para hoje
  const agendamentosHoje = await prisma.agendamento.findMany({
    where: {
      dataInicio: {
        gte: hoje,
        lt: amanha,
      },
      status: {
        in: ['agendado', 'confirmado'],
      },
    },
    include: {
      jangada: { select: { numeroSerie: true } },
      navio: { select: { nome: true } },
      cilindro: { select: { numeroSerie: true } },
    },
  });

  // Agendamentos próximos (3 dias)
  const agendamentosProximos = await prisma.agendamento.findMany({
    where: {
      dataInicio: {
        gte: amanha,
        lt: em3Dias,
      },
      status: 'agendado',
    },
    include: {
      jangada: { select: { numeroSerie: true } },
      navio: { select: { nome: true } },
    },
  });

  // Criar notificações
  const notificacoes = [];

  for (const agendamento of agendamentosHoje) {
    const notificacao = await prisma.notificacao.create({
      data: {
        tipo: 'warning',
        titulo: `🔔 Agendamento HOJE: ${agendamento.titulo}`,
        mensagem: `${agendamento.tipo} agendada para hoje às ${new Date(agendamento.dataInicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}. ${agendamento.jangada ? `Jangada: ${agendamento.jangada.numeroSerie}` : agendamento.navio ? `Navio: ${agendamento.navio.nome}` : ''}`,
        lida: false,
        ...(agendamento.navioId && { navioId: agendamento.navioId }),
      },
    });
    notificacoes.push(notificacao);
  }

  for (const agendamento of agendamentosProximos) {
    const diasRestantes = Math.ceil(
      (new Date(agendamento.dataInicio).getTime() - hoje.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    
    const notificacao = await prisma.notificacao.create({
      data: {
        tipo: 'info',
        titulo: `📅 Lembrete: ${agendamento.titulo} em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`,
        mensagem: `Agendado para ${new Date(agendamento.dataInicio).toLocaleDateString('pt-PT')}`,
        lida: false,
        ...(agendamento.navioId && { navioId: agendamento.navioId }),
      },
    });
    notificacoes.push(notificacao);
  }

  return {
    agendamentosHoje: agendamentosHoje.length,
    agendamentosProximos: agendamentosProximos.length,
    notificacoesCriadas: notificacoes.length,
  };
}

async function enviarLembretesJangadas() {
  const hoje = new Date();
  const em15Dias = new Date();
  em15Dias.setDate(em15Dias.getDate() + 15);
  const em30Dias = new Date();
  em30Dias.setDate(em30Dias.getDate() + 30);

  // Jangadas vencidas
  const jangadasVencidas = await prisma.jangada.findMany({
    where: {
      dataProximaInspecao: {
        lt: hoje,
      },
      status: 'ativo',
    },
    include: {
      cliente: { select: { nome: true, email: true } },
    },
  });

  // Jangadas que vencem em 15 dias
  const jangadas15Dias = await prisma.jangada.findMany({
    where: {
      dataProximaInspecao: {
        gte: hoje,
        lte: em15Dias,
      },
      status: 'ativo',
    },
    include: {
      cliente: { select: { nome: true, email: true } },
    },
  });

  // Jangadas que vencem em 30 dias
  const jangadas30Dias = await prisma.jangada.findMany({
    where: {
      dataProximaInspecao: {
        gt: em15Dias,
        lte: em30Dias,
      },
      status: 'ativo',
    },
    include: {
      cliente: { select: { nome: true } },
    },
  });

  const notificacoes = [];

  // Notificações para jangadas vencidas (URGENTE)
  for (const jangada of jangadasVencidas) {
    const notificacao = await prisma.notificacao.create({
      data: {
        tipo: 'error',
        titulo: `🚨 URGENTE: Jangada ${jangada.numeroSerie} com inspeção VENCIDA`,
        mensagem: `Cliente: ${jangada.cliente?.nome}. Venceu em ${jangada.dataProximaInspecao?.toLocaleDateString('pt-PT')}. Agendar inspeção imediatamente!`,
        lida: false,
      },
    });
    notificacoes.push(notificacao);
  }

  // Notificações para jangadas em 15 dias (ALTA)
  for (const jangada of jangadas15Dias) {
    const notificacao = await prisma.notificacao.create({
      data: {
        tipo: 'warning',
        titulo: `⚠️ Jangada ${jangada.numeroSerie} vence em 15 dias`,
        mensagem: `Cliente: ${jangada.cliente?.nome}. Vencimento: ${jangada.dataProximaInspecao?.toLocaleDateString('pt-PT')}. Agendar inspeção.`,
        lida: false,
      },
    });
    notificacoes.push(notificacao);
  }

  return {
    jangadasVencidas: jangadasVencidas.length,
    jangadas15Dias: jangadas15Dias.length,
    jangadas30Dias: jangadas30Dias.length,
    notificacoesCriadas: notificacoes.length,
    emailsEnviados: 0, // TODO: Implementar envio de emails
  };
}

async function gerarRelatorioSemanal() {
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  // Estatísticas da semana
  const [
    inspecoesRealizadas,
    jangadasCriadas,
    agendamentosCriados,
    obrasFinalizadas,
    stockMovimentacoes,
  ] = await Promise.all([
    prisma.inspecao.count({
      where: {
        createdAt: {
          gte: seteDiasAtras,
        },
      },
    }),
    prisma.jangada.count({
      where: {
        createdAt: {
          gte: seteDiasAtras,
        },
      },
    }),
    prisma.agendamento.count({
      where: {
        createdAt: {
          gte: seteDiasAtras,
        },
      },
    }),
    prisma.obra.count({
      where: {
        status: 'CONCLUIDA',
        updatedAt: {
          gte: seteDiasAtras,
        },
      },
    }),
    prisma.movimentacaoStock.count({
      where: {
        data: {
          gte: seteDiasAtras,
        },
      },
    }),
  ]);

  // Criar notificação de relatório semanal
  const notificacao = await prisma.notificacao.create({
    data: {
      tipo: 'success',
      titulo: '📊 Relatório Semanal - ' + hoje.toLocaleDateString('pt-PT'),
      mensagem: `Resumo da semana passada:\n• ${inspecoesRealizadas} inspeções realizadas\n• ${jangadasCriadas} jangadas criadas\n• ${agendamentosCriados} agendamentos criados\n• ${obrasFinalizadas} obras finalizadas\n• ${stockMovimentacoes} movimentações de stock`,
      lida: false,
    },
  });

  return {
    periodo: `${seteDiasAtras.toLocaleDateString('pt-PT')} - ${hoje.toLocaleDateString('pt-PT')}`,
    estatisticas: {
      inspecoesRealizadas,
      jangadasCriadas,
      agendamentosCriados,
      obrasFinalizadas,
      stockMovimentacoes,
    },
    notificacaoCriada: true,
    emailEnviado: false, // TODO: Implementar envio de email
  };
}
