import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const { validade, estado } = body;

    // Atualiza validade e estado do componente
    const updated = await prisma.inspecaoComponente.update({
      where: { id },
      data: {
        ...(validade !== undefined ? { validade: new Date(validade) } : {}),
        ...(estado !== undefined ? { estado } : {}),
      },
    });

    return NextResponse.json({ success: true, componente: updated });
  } catch (error) {
    console.error('Erro ao atualizar inspecaoComponente:', error);
    return NextResponse.json({ error: 'Erro ao atualizar componente' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
