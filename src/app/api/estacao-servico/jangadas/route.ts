import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as jangadas que estão na estação de serviço (não instaladas em navios)
    const jangadas = await prisma.jangada.findMany({
      where: {
        status: {
          not: 'instalado'
        }
      },
      include: {
        marca: true,
        modelo: true,
        navio: {
          include: {
            cliente: true
          }
        },
        cliente: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as any;

    // Formatar os dados para o frontend
    const formattedJangadas = jangadas.map((jangada: any) => ({
      id: jangada.id,
      numeroSerie: jangada.numeroSerie,
      modelo: jangada.modelo?.nome || 'N/A',
      marca: jangada.marca?.nome || 'N/A',
      status: jangada.status,
      localizacaoAtual: 'Estação de Serviço - Cabouco',
      dataUltimaInspecao: jangada.dataInspecao?.toISOString().split('T')[0] || 'N/A',
      proximaInspecao: jangada.dataProximaInspecao?.toISOString().split('T')[0] || 'N/A',
      navioInstalado: jangada.navio?.nome || null,
      cliente: jangada.navio?.cliente?.nome || jangada.cliente?.nome || 'N/A'
    }));

    return NextResponse.json(formattedJangadas);
  } catch (error) {
    console.error('Erro ao carregar jangadas da estação de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar jangadas da estação de serviço' },
      { status: 500 }
    );
  }
}