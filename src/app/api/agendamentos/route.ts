import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Rotina automática: reagendar se inspeção não iniciada
    const hoje = new Date();
    const agendamentosPendentes = await prisma.agendamento.findMany({
      where: {
        status: 'agendado',
        dataInicio: {
          lt: hoje,
        },
      },
    });
    for (const agendamento of agendamentosPendentes) {
      // Se não foi iniciada, mover para o próximo dia útil
      const proximoDia = new Date(hoje);
      proximoDia.setDate(hoje.getDate() + 1);
      await prisma.agendamento.update({
        where: { id: agendamento.id },
        data: {
          dataInicio: proximoDia,
          dataFim: proximoDia,
        },
      });
    }
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const prioridade = searchParams.get('prioridade');
    const responsavel = searchParams.get('responsavel');
    const proximos = searchParams.get('proximos'); // 'true' para agendamentos próximos (30 dias)
    const estacaoServico = searchParams.get('estacaoServico'); // 'true' para jangadas na estação de serviço
    const sortBy = searchParams.get('sortBy') || 'dataInicio';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Prisma.AgendamentoWhereInput = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (prioridade) {
      where.prioridade = prioridade;
    }

    if (responsavel) {
      where.responsavel = responsavel;
    }

    // Filtro para agendamentos próximos (próximos 30 dias)
    if (proximos === 'true') {
      const hoje = new Date();
      const daqui30Dias = new Date();
      daqui30Dias.setDate(hoje.getDate() + 30);
      
      where.dataInicio = {
        gte: hoje,
        lte: daqui30Dias,
      };
    }

    // Filtro para jangadas na estação de serviço
    if (estacaoServico === 'true') {
      where.jangada = {
        dataEntradaEstacao: {
          not: null,
        },
      };
    }

    const total = await prisma.agendamento.count({ where });

    const agendamentos = await prisma.agendamento.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    });

    // Sugestão de agendamento: jangadas próximas da dataEntregaSolicitada sem inspeção agendada
    const doisDias = 2 * 24 * 60 * 60 * 1000;
    const hojeSugestao = new Date();
    const jangadasProximas = await prisma.jangada.findMany({
      where: {
        dataEntregaSolicitada: {
          lte: new Date(hojeSugestao.getTime() + doisDias),
        },
      },
      include: {
        navio: true,
      },
    });
    // Sugestões avançadas agrupadas por navio
    const tecnicos = ['Julio Correia', 'Alex Santos'];
    const sugestoesPorNavio: Record<string, any[]> = {};
    for (const jangada of jangadasProximas) {
      const agendamentosJangada = await prisma.agendamento.findMany({
        where: { jangadaId: jangada.id },
      });
      const navioNome = jangada.navio?.nome || 'Navio desconhecido';
      if (!sugestoesPorNavio[navioNome]) sugestoesPorNavio[navioNome] = [];
      // Sugestão de inspeção urgente
      if (agendamentosJangada.length === 0) {
        sugestoesPorNavio[navioNome].push({
          jangadaId: jangada.id,
          numeroSerie: jangada.numeroSerie,
          sugestao: 'Agendar inspeção urgente',
        });
      }
      // Slots livres por técnico
      for (const tecnico of tecnicos) {
        // Buscar inspeções do técnico nos próximos 7 dias
        const hojeSlot = new Date();
        for (let i = 0; i < 7; i++) {
          const dia = new Date(hojeSlot);
          dia.setDate(hojeSlot.getDate() + i);
          const inspecoesDia = await prisma.agendamento.count({
            where: {
              responsavel: tecnico,
              dataInicio: {
                gte: new Date(dia.setHours(0,0,0,0)),
                lte: new Date(dia.setHours(23,59,59,999)),
              },
            },
          });
          if (inspecoesDia < 2) {
            sugestoesPorNavio[navioNome].push({
              tecnico,
              dia: dia.toISOString().slice(0,10),
              sugestao: `Slot livre para ${tecnico} (${2-inspecoesDia} vagas)`,
              jangadaId: jangada.id,
              numeroSerie: jangada.numeroSerie,
            });
          }
        }
      }
      // Priorização por urgência
      if (jangada.dataEntregaSolicitada) {
        const diasRestantes = Math.ceil((new Date(jangada.dataEntregaSolicitada).getTime() - hojeSugestao.getTime()) / (24*60*60*1000));
        if (diasRestantes <= 2) {
          sugestoesPorNavio[navioNome].push({
            jangadaId: jangada.id,
            numeroSerie: jangada.numeroSerie,
            sugestao: `Inspeção prioritária: entrega em ${diasRestantes} dias`,
          });
        }
      }
      // Visualização de conflitos
      for (const tecnico of tecnicos) {
        const inspecoesHoje = await prisma.agendamento.count({
          where: {
            responsavel: tecnico,
            dataInicio: {
              gte: new Date(hoje.setHours(0,0,0,0)),
              lte: new Date(hoje.setHours(23,59,59,999)),
            },
          },
        });
        if (inspecoesHoje >= 2) {
          sugestoesPorNavio[navioNome].push({
            tecnico,
            sugestao: `Conflito: técnico ${tecnico} já possui 2 inspeções hoje`,
          });
        }
      }
    }
    return NextResponse.json({
      data: agendamentos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      sugestoesPorNavio,
    });

  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating agendamento with data:', body);

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: body.titulo,
        descricao: body.descricao,
        dataInicio: new Date(body.dataInicio),
        dataFim: new Date(body.dataFim),
        tipo: body.tipo,
        status: body.status || 'agendado',
        prioridade: body.prioridade || 'normal',
        navioId: body.navioId || null,
        jangadaId: body.jangadaId || null,
        cilindroId: body.cilindroId || null,
        pessoaId: body.pessoaId || null,
        responsavel: body.responsavel || null,
      },
      include: {
        navio: {
          select: { id: true, nome: true, matricula: true },
        },
        jangada: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        cilindro: {
          select: { id: true, numeroSerie: true, tipo: true },
        },
        pessoa: {
          select: { id: true, nome: true, cargo: true },
        },
      },
    });

    console.log('Agendamento created successfully:', agendamento.id);
    return NextResponse.json(agendamento, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
