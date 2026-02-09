import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COMPONENTES_INSPECAO } from '@/lib/inspecao-components';

/**
 * GET /api/stock/componentes-inspecao
 * Retorna todos os componentes de inspeção com seu stock atual
 */
export async function GET() {
  try {
    const componentesComStock = await Promise.all(
      COMPONENTES_INSPECAO.map(async (componente) => {
        const stock = await prisma.stock.findFirst({
          where: {
            nome: componente.nome,
            categoria: 'Inspeção'
          }
        });

        return {
          id: stock?.id,
          nome: componente.nome,
          descricao: componente.descricao,
          categoria: 'Inspeção',
          quantidade: stock?.quantidade || 0,
          quantidadeMinima: stock?.quantidadeMinima || 1,
          precoUnitario: stock?.precoUnitario || 0,
          status: stock?.status || 'ativo',
          em_alerta: (stock?.quantidade || 0) <= (stock?.quantidadeMinima || 1)
        };
      })
    );

    return NextResponse.json({
      data: componentesComStock,
      total: componentesComStock.length,
      em_alerta: componentesComStock.filter(c => c.em_alerta).length
    });
  } catch (error) {
    console.error('Erro ao buscar componentes de inspeção:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar componentes de inspeção' },
      { status: 500 }
    );
  }
}
