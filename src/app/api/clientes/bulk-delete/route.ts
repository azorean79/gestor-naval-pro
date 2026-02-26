import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs devem ser fornecidos como array' }, { status: 400 });
    }

    // Delete clientes
    await prisma.cliente.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      message: `${ids.length} cliente(s) deletado(s) com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao deletar clientes:', error);
    return NextResponse.json({ error: 'Erro ao deletar clientes' }, { status: 500 });
  }
}