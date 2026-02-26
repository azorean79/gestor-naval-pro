import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get counts using Prisma
    const [totalJangadas, totalNavios, totalClientes, totalStockItems] = await Promise.all([
      prisma.jangada.count(),
      prisma.navio.count(),
      prisma.cliente.count(),
      prisma.itemStock.count(),
    ]);

    // Get upcoming inspections (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingInspections = await prisma.jangada.findMany({
      where: {
        proximaInspecao: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      select: {
        id: true,
        numero: true,
        proximaInspecao: true,
      },
      orderBy: {
        proximaInspecao: 'asc',
      },
      take: 10,
    });

    // Get jangadas by status
    const jangadasByStatus = await prisma.jangada.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return NextResponse.json({
      totalJangadas,
      totalNavios,
      totalClientes,
      totalStockItems,
      jangadasByStatus,
      upcomingInspections,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}