import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildClienteTerceirosTemplateArtifacts } from '@/lib/cliente-terceiros-template';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'ID de cliente inválido.' }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        navios: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            ilha: true,
            tipoPesca: true,
          },
          orderBy: [{ nome: 'asc' }],
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const { buffer, fileName } = await buildClienteTerceirosTemplateArtifacts(cliente);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar ficha de cliente em Excel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível gerar a ficha de cliente.' },
      { status: 500 }
    );
  }
}