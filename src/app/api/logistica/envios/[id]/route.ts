import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, dataEntregaReal, numeroRastreio } = body;

    const envio = await prisma.envio.update({
      where: { id },
      data: {
        status,
        dataEntregaReal: status === 'entregue' ? new Date() : undefined,
        numeroRastreio,
        dataEnvio: status === 'enviado' ? new Date() : undefined
      },
      include: {
        itens: {
          include: {
            stock: true,
            jangada: true
          }
        }
      }
    });

    return NextResponse.json(envio);
  } catch (error) {
    console.error('Erro ao atualizar envio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Primeiro, buscar o envio para devolver os itens ao stock se necessário
    const envio = await prisma.envio.findUnique({
      where: { id },
      include: { itens: true }
    });

    if (!envio) {
      return NextResponse.json({ error: 'Envio não encontrado' }, { status: 404 });
    }

    // Se o envio ainda não foi enviado, devolver itens ao stock
    if (envio.status === 'preparando') {
      for (const item of envio.itens) {
        if (item.tipoItem === 'stock' && item.stockId) {
          await prisma.stock.update({
            where: { id: item.stockId },
            data: {
              quantidade: {
                increment: item.quantidade
              }
            }
          });
        }
      }
    }

    // Deletar o envio (itens serão deletados automaticamente devido ao onDelete: Cascade)
    await prisma.envio.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar envio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}