import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marcaId = searchParams.get('marcaId');
    const status = searchParams.get('status');

    const where: any = {};
    if (marcaId) {
      where.marcaId = marcaId;
    }
    if (status) {
      where.ativo = status === 'ativo';
    }

    const modelos = await prisma.modeloJangada.findMany({
      where,
      include: {
        marca: true,
        itensModelo: {
          include: {
            stock: true,
          },
        },
      },
      orderBy: { nome: 'asc' },

    });

    const data = modelos.map((modelo) => ({
      ...modelo,
      status: modelo.ativo ? 'ativo' : 'inativo',
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching modelos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modelos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const itensModelo = Array.isArray(body.itensModelo) ? body.itensModelo : [];
    const ativo = body.status ? body.status === 'ativo' : true;

    const itensModeloData = itensModelo
      .filter((item: any) => item?.stockId)
      .map((item: any) => ({
        stockId: item.stockId,
        quantidade: typeof item.quantidade === 'number' && item.quantidade > 0 ? item.quantidade : 1,
      }));

    const modelo = await prisma.modeloJangada.create({
      data: {
        nome: body.nome,
        marcaId: body.marcaId,
        ativo,
        itensModelo: itensModeloData.length > 0 ? {
          create: itensModeloData,
        } : undefined,
      },
      include: {
        marca: true,
        itensModelo: {
          include: {
            stock: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...modelo,
      status: modelo.ativo ? 'ativo' : 'inativo',
    });
  } catch (error) {
    console.error('Error creating modelo:', error);
    return NextResponse.json(
      { error: 'Failed to create modelo' },
      { status: 500 }
    );
  }
}