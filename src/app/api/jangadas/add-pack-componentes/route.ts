import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getComponentesNecessarios } from '@/lib/stock-utils';

/**
 * POST /api/jangadas/add-pack-componentes
 * Adiciona todos os componentes de um pack específico ao stock
 */
export async function POST(request: NextRequest) {
  try {
    const { tipoPack, componentesSelecionados, jangadaNumeroSerie, tecnico } = await request.json();

    if (!tipoPack && !componentesSelecionados) {
      return NextResponse.json(
        { error: 'tipoPack ou componentesSelecionados requeridos' },
        { status: 400 }
      );
    }

    // Extrair componentes do pack
    const componentesNecessarios = getComponentesNecessarios(
      '', // tipo vazio - só queremos os do pack
      tipoPack,
      undefined,
      undefined,
      componentesSelecionados
    );

    if (componentesNecessarios.length === 0) {
      return NextResponse.json({
        message: 'Nenhum componente para adicionar ao stock',
        componentesAdicionados: 0,
      });
    }

    // Usar transação para adicionar todos os componentes
    const resultado = await prisma.$transaction(async (tx) => {
      let componentesAdicionados = 0;

      for (const componente of componentesNecessarios) {
        const itemStock = await tx.stock.findFirst({
          where: {
            nome: componente.nome,
            status: 'ativo',
          },
        });

        if (itemStock) {
          // Incrementar quantidade
          await tx.stock.update({
            where: { id: itemStock.id },
            data: {
              quantidade: itemStock.quantidade + componente.quantidadeNecessaria,
            },
          });

          // Registrar movimentação
          await tx.movimentacaoStock.create({
            data: {
              stockId: itemStock.id,
              tipo: 'entrada',
              quantidade: componente.quantidadeNecessaria,
              motivo: `Pack adicionado${jangadaNumeroSerie ? ` - Jangada ${jangadaNumeroSerie}` : ''}`,
              responsavel: tecnico || 'Sistema',
            },
          });
        } else {
          // Criar item novo no stock
          const novoItem = await tx.stock.create({
            data: {
              nome: componente.nome,
              categoria: 'Componentes Pack',
              quantidade: componente.quantidadeNecessaria,
              quantidadeMinima: 1,
              precoUnitario: 0,
              status: 'ativo',
            },
          });

          // Registrar movimentação
          await tx.movimentacaoStock.create({
            data: {
              stockId: novoItem.id,
              tipo: 'entrada',
              quantidade: componente.quantidadeNecessaria,
              motivo: `Pack adicionado${jangadaNumeroSerie ? ` - Jangada ${jangadaNumeroSerie}` : ''}`,
              responsavel: tecnico || 'Sistema',
            },
          });
        }

        componentesAdicionados++;
      }

      return componentesAdicionados;
    });

    return NextResponse.json({
      message: 'Componentes do pack adicionados com sucesso ao stock',
      componentesAdicionados: resultado,
      componentes: componentesNecessarios,
    });

  } catch (error) {
    console.error('Erro ao adicionar componentes do pack:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar componentes do pack' },
      { status: 500 }
    );
  }
}
