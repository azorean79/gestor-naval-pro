import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AlertaCritico, SugestaoJulinho, ResumoJulinho } from '@/hooks/use-julinho-widget';

export async function GET(request: NextRequest) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const em15Dias = new Date();
    em15Dias.setDate(em15Dias.getDate() + 15);
    
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    // Buscar dados em paralelo
    const [
      agendamentosHoje,
      jangadasVencimento15Dias,
      jangadasVencimento30Dias,
      cilindrosExpirados,
      stockCritico,
      obrasAbertas,
      jangadasVencidas,
    ] = await Promise.all([
      // Agendamentos de hoje
      prisma.agendamento.findMany({
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
        },
      }),

      // Jangadas que vencem em 15 dias
      prisma.jangada.findMany({
        where: {
          dataProximaInspecao: {
            lte: em15Dias,
            gte: hoje,
          },
        },
        include: {
          cliente: { select: { nome: true } },
        },
      }),

      // Jangadas que vencem em 30 dias
      prisma.jangada.findMany({
        where: {
          dataProximaInspecao: {
            lte: em30Dias,
            gte: hoje,
          },
        },
      }),

      // Cilindros expirados
      prisma.cilindro.findMany({
        where: {
          dataProximoTeste: {
            lt: hoje,
          },
        },
        take: 10,
      }),

      // Stock crítico (quantidade <= 5)
      prisma.stock.findMany({
        where: {
          quantidade: {
            lte: 5,
          },
        },
        orderBy: {
          quantidade: 'asc',
        },
      }),

      // Obras em progresso
      prisma.obra.count({
        where: {
          status: 'EM_PROGRESSO',
        },
      }),

      // Jangadas já vencidas
      prisma.jangada.findMany({
        where: {
          dataProximaInspecao: {
            lt: hoje,
          },
        },
        include: {
          cliente: { select: { nome: true } },
        },
      }),
    ]);

    // Gerar alertas críticos
    const alertas: AlertaCritico[] = [];

    // Jangadas vencidas (URGENTE)
    if (jangadasVencidas.length > 0) {
      jangadasVencidas.forEach((jangada) => {
        alertas.push({
          id: `jangada-vencida-${jangada.id}`,
          tipo: 'jangada_vencida',
          titulo: `⚠️ Jangada ${jangada.numeroSerie} com inspeção VENCIDA`,
          descricao: `Cliente: ${jangada.cliente?.nome || 'N/A'}. Venceu em ${jangada.dataProximaInspecao?.toLocaleDateString('pt-PT')}`,
          prioridade: 'urgente',
          dados: jangada,
          createdAt: new Date(),
        });
      });
    }

    // Agendamentos de hoje
    if (agendamentosHoje.length > 0) {
      alertas.push({
        id: 'agendamentos-hoje',
        tipo: 'agendamento_hoje',
        titulo: `📅 ${agendamentosHoje.length} agendamento${agendamentosHoje.length > 1 ? 's' : ''} para hoje`,
        descricao: agendamentosHoje.map(a => a.titulo).join(', '),
        prioridade: 'alta',
        dados: agendamentosHoje,
        createdAt: new Date(),
      });
    }

    // Cilindros expirados
    if (cilindrosExpirados.length > 0) {
      alertas.push({
        id: 'cilindros-expirados',
        tipo: 'cilindro_expirado',
        titulo: `🔴 ${cilindrosExpirados.length} cilindro${cilindrosExpirados.length > 1 ? 's expirados' : ' expirado'}`,
        descricao: 'Testes hidrostáticos vencidos. Agendar testes urgentemente.',
        prioridade: 'alta',
        dados: cilindrosExpirados,
        createdAt: new Date(),
      });
    }

    // Stock crítico
    if (stockCritico.length > 0) {
      const itemsCriticos = stockCritico.slice(0, 3).map(s => s.nome).join(', ');
      alertas.push({
        id: 'stock-critico',
        tipo: 'stock_critico',
        titulo: `📦 ${stockCritico.length} ${stockCritico.length > 1 ? 'itens' : 'item'} com stock crítico`,
        descricao: `${itemsCriticos}${stockCritico.length > 3 ? '...' : ''}`,
        prioridade: 'media',
        dados: stockCritico,
        createdAt: new Date(),
      });
    }

    // Gerar sugestões inteligentes
    const sugestoes: SugestaoJulinho[] = [];

    // Sugestão: Agendar jangadas próximas do vencimento
    if (jangadasVencimento15Dias.length > 0) {
      sugestoes.push({
        id: 'agendar-jangadas-15dias',
        tipo: 'agendar',
        titulo: `🗓️ ${jangadasVencimento15Dias.length} jangada${jangadasVencimento15Dias.length > 1 ? 's vencem' : ' vence'} em 15 dias`,
        descricao: 'Recomendo agendar as inspeções agora para evitar vencimentos.',
        acao: '/agenda',
        icone: '📅',
      });
    }

    // Sugestão: Repor stock
    if (stockCritico.length > 0) {
      sugestoes.push({
        id: 'repor-stock',
        tipo: 'stock',
        titulo: `📦 Repor ${stockCritico.length} ${stockCritico.length > 1 ? 'itens' : 'item'} de stock`,
        descricao: 'Stock abaixo do mínimo. Fazer encomenda aos fornecedores.',
        acao: '/stock',
        icone: '🛒',
      });
    }

    // Sugestão: Obras em progresso
    if (obrasAbertas > 5) {
      sugestoes.push({
        id: 'obras-abertas',
        tipo: 'obra',
        titulo: `🔧 ${obrasAbertas} obras em progresso`,
        descricao: 'Verificar se há obras que podem ser finalizadas e faturadas.',
        acao: '/obras',
        icone: '✅',
      });
    }

    // Sugestão: Relatório semanal
    const diaSemana = hoje.getDay();
    if (diaSemana === 1) { // Segunda-feira
      sugestoes.push({
        id: 'relatorio-semanal',
        tipo: 'relatorio',
        titulo: '📊 Gerar relatório semanal',
        descricao: 'É segunda-feira! Hora de gerar o relatório da semana passada.',
        icone: '📈',
      });
    }

    // Mensagem de bom dia personalizada
    const hora = new Date().getHours();
    let saudacao = 'Bom dia';
    if (hora >= 12 && hora < 18) saudacao = 'Boa tarde';
    if (hora >= 18) saudacao = 'Boa noite';

    let mensagemBomDia = `${saudacao}! `;
    
    if (alertas.length === 0 && agendamentosHoje.length === 0) {
      mensagemBomDia += '✅ Tudo tranquilo hoje. Sem alertas críticos.';
    } else if (agendamentosHoje.length > 0) {
      mensagemBomDia += `📋 Tem ${agendamentosHoje.length} inspeção${agendamentosHoje.length > 1 ? 'ões' : ''} agendada${agendamentosHoje.length > 1 ? 's' : ''} para hoje.`;
    } else if (jangadasVencidas.length > 0) {
      mensagemBomDia += `⚠️ Atenção: ${jangadasVencidas.length} jangada${jangadasVencidas.length > 1 ? 's' : ''} com inspeção vencida!`;
    } else {
      mensagemBomDia += `Monitorando ${jangadasVencimento30Dias.length} jangada${jangadasVencimento30Dias.length > 1 ? 's' : ''} nos próximos 30 dias.`;
    }

    const resumo: ResumoJulinho = {
      alertas: alertas.sort((a, b) => {
        const prioridadeOrder = { urgente: 0, alta: 1, media: 2, baixa: 3 };
        return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      }),
      sugestoes,
      agendamentosHoje: agendamentosHoje.length,
      jangadasVencimento: jangadasVencimento30Dias.length,
      cilindrosExpirados: cilindrosExpirados.length,
      stockCritico: stockCritico.length,
      obrasAbertas,
      mensagemBomDia,
    };

    return NextResponse.json(resumo);
  } catch (error: any) {
    console.error('Erro ao gerar widget do Julinho:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar resumo', details: error.message },
      { status: 500 }
    );
  }
}
