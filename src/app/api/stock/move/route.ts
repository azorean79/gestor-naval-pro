import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/stock/move - movimentar stock (entrada/saida)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, codigo, tipo, quantidade = 1, motivo, responsavel, destino, cilindroId, jangadaId } = body;

    if (!tipo || (tipo !== 'entrada' && tipo !== 'saida')) {
      return NextResponse.json({ error: 'Tipo inválido. Use entrada ou saida.' }, { status: 400 });
    }

    if (!itemId && !codigo) {
      return NextResponse.json({ error: 'Informe itemId ou codigo do item.' }, { status: 400 });
    }

    // localizar item
    const item = itemId ? await prisma.itemStock.findUnique({ where: { id: itemId } }) : await prisma.itemStock.findUnique({ where: { codigo } });
    if (!item) return NextResponse.json({ error: 'Item de stock não encontrado' }, { status: 404 });

    const qty = Number(quantidade) || 1;

    // calcular nova quantidade
    const newQuantidade = tipo === 'entrada' ? (Number(item.quantidadeAtual || 0) + qty) : (Number(item.quantidadeAtual || 0) - qty);

    // Previna valores negativos
    if (newQuantidade < 0) {
      return NextResponse.json({ error: 'Quantidade insuficiente em stock' }, { status: 400 });
    }

    // executar transação: criar movimentacao e atualizar quantidade
    const result = await prisma.$transaction([
      prisma.movimentacaoStock.create({
        data: ({
          itemId: item.id,
          tipo: tipo,
          quantidade: qty,
          motivo: motivo || (destino ? `Movimentação para ${destino}` : 'Movimentação manual'),
          responsavel: responsavel || 'sistema',
          valorUnitario: body.valorUnitario || null,
          observacoes: body.observacoes || null,
        } as any)
      }),
      prisma.itemStock.update({
        where: { id: item.id },
        data: { quantidadeAtual: newQuantidade }
      })
    ]);

    // Se for uma saída para uma jangada e foi passado cilindroId ou jangadaId, associe
    try {
      if (tipo === 'saida' && jangadaId && cilindroId) {
        await prisma.jangada.update({ where: { id: jangadaId }, data: { cilindro: cilindroId } });
      }
    } catch (e) {
      console.error('Falha ao associar cilindro à jangada:', e);
    }

    return NextResponse.json({ message: 'Movimentação registada', movimentacao: result[0], item: result[1] });
  } catch (error) {
    console.error('Erro ao movimentar stock:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
