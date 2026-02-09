import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jangadaData, certificadoData } = body;

    // Save jangada data
    const savedJangada = await prisma.jangada.upsert({
      where: { numeroSerie: jangadaData.numeroSerie },
      update: jangadaData,
      create: jangadaData,
    });

    let savedCertificado = null;

    // Save certificado if provided
    if (certificadoData && certificadoData.numero) {
      savedCertificado = await prisma.certificado.upsert({
        where: { numero: certificadoData.numero },
        update: certificadoData,
        create: certificadoData,
      });
    }

    return NextResponse.json({
      success: true,
      jangada: savedJangada,
      certificado: savedCertificado
    });

  } catch (error) {
    console.error('Erro ao salvar dados do quadro:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}