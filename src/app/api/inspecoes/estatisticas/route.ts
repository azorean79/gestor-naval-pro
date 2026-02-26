import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as inspeções
    const inspecoes = await prisma.inspecao.findMany();

    // Calcular estatísticas básicas
    const totalInspecoes = inspecoes.length;
    const inspecoesEmAndamento = inspecoes.filter(i => i.status === 'em_andamento').length;
    const inspecoesConcluidas = inspecoes.filter(i => i.status === 'concluida').length;
    const inspecoesAprovadas = inspecoes.filter(i => i.status === 'aprovada').length;
    const inspecoesReprovadas = inspecoes.filter(i => i.status === 'reprovada').length;
    const taxaAprovacao = totalInspecoes > 0 ? (inspecoesAprovadas / totalInspecoes) * 100 : 0;

    // Estatísticas por tipo
    const inspecoesPorTipo = {
      anual: inspecoes.filter(i => i.tipoInspecao === 'anual').length,
      extraordinaria: inspecoes.filter(i => i.tipoInspecao === 'extraordinaria').length,
      inicial: inspecoes.filter(i => i.tipoInspecao === 'inicial').length,
      final: inspecoes.filter(i => i.tipoInspecao === 'final').length
    };

    // Estatísticas por mês (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const inspecoesRecentes = inspecoes.filter(i => new Date(i.dataInspecao) >= seisMesesAtras);

    const inspecoesPorMes = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mes = data.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });

      const inspecoesMes = inspecoesRecentes.filter(inspecao => {
        const dataInspecao = new Date(inspecao.dataInspecao);
        return dataInspecao.getMonth() === data.getMonth() &&
               dataInspecao.getFullYear() === data.getFullYear();
      });

      inspecoesPorMes.push({
        mes,
        total: inspecoesMes.length,
        aprovadas: inspecoesMes.filter(i => i.status === 'aprovada').length,
        reprovadas: inspecoesMes.filter(i => i.status === 'reprovada').length
      });
    }

    // Próximas inspeções (próximos 30 dias)
    const hoje = new Date();
    const trintaDiasFrente = new Date();
    trintaDiasFrente.setDate(hoje.getDate() + 30);

    const proximasInspecoes = inspecoes
      .filter(i => {
        const dataInspecao = new Date(i.dataInspecao);
        return dataInspecao >= hoje && dataInspecao <= trintaDiasFrente && i.status === 'em_andamento';
      })
      .map(i => ({
        id: i.id,
        equipamentoNome: i.equipamentoNome,
        clienteNome: i.clienteNome,
        dataInspecao: i.dataInspecao,
        tipoInspecao: i.tipoInspecao,
        diasRestantes: Math.ceil((new Date(i.dataInspecao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 5); // Top 5 próximas

    // Alertas
    const alertas: Array<{ tipo: 'atraso' | 'reprovada' | 'proxima'; mensagem: string; inspecaoId: string }> = [];

    // Inspeções atrasadas (mais de 7 dias sem conclusão)
    const inspecoesAtrasadas = inspecoes.filter(i => {
      if (i.status !== 'em_andamento') return false;
      const dataInspecao = new Date(i.dataInspecao);
      const diasPassados = Math.floor((hoje.getTime() - dataInspecao.getTime()) / (1000 * 60 * 60 * 24));
      return diasPassados > 7;
    });

    inspecoesAtrasadas.forEach(i => {
      alertas.push({
        tipo: 'atraso' as const,
        mensagem: `Inspeção do ${i.equipamentoNome} está atrasada`,
        inspecaoId: i.id
      });
    });

    // Próximas inspeções (menos de 3 dias)
    proximasInspecoes.filter(p => p.diasRestantes <= 3).forEach(p => {
      alertas.push({
        tipo: 'proxima' as const,
        mensagem: `Inspeção do ${p.equipamentoNome} em ${p.diasRestantes} dia(s)`,
        inspecaoId: p.id
      });
    });

    // Inspeções reprovadas recentemente
    const inspecoesReprovadasRecentes = inspecoes.filter(i => {
      if (i.status !== 'reprovada') return false;
      const dataConclusao = i.dataConclusao ? new Date(i.dataConclusao) : null;
      if (!dataConclusao) return false;
      const diasPassados = Math.floor((hoje.getTime() - dataConclusao.getTime()) / (1000 * 60 * 60 * 24));
      return diasPassados <= 7;
    });

    inspecoesReprovadasRecentes.forEach(i => {
      alertas.push({
        tipo: 'reprovada' as const,
        mensagem: `Inspeção do ${i.equipamentoNome} reprovada - necessita correções`,
        inspecaoId: i.id
      });
    });

    const estatisticas = {
      totalInspecoes,
      inspecoesEmAndamento,
      inspecoesConcluidas,
      inspecoesAprovadas,
      inspecoesReprovadas,
      taxaAprovacao: Math.round(taxaAprovacao * 10) / 10, // Arredondar para 1 casa decimal
      inspecoesPorTipo,
      inspecoesPorMes,
      proximasInspecoes,
      alertas
    };

    return NextResponse.json(estatisticas);

  } catch (error) {
    console.error('Erro ao buscar estatísticas das inspeções:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}