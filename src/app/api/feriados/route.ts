import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());
    const tipo = searchParams.get('tipo'); // nacional, regional, local
    const regiao = searchParams.get('regiao');

    const where: any = {
      ativo: true,
      OR: [
        { data: { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) } },
        { recorrente: true }
      ]
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (regiao) {
      where.regiao = regiao;
    }

    const feriados = await prisma.feriado.findMany({
      where,
      orderBy: { data: 'asc' }
    });

    // Para feriados recorrentes, ajustar a data para o ano atual
    const feriadosAjustados = feriados.map(feriado => {
      if (feriado.recorrente) {
        const dataOriginal = new Date(feriado.data);
        const dataAjustada = new Date(ano, dataOriginal.getMonth(), dataOriginal.getDate());
        return {
          ...feriado,
          data: dataAjustada.toISOString()
        };
      }
      return feriado;
    });

    return NextResponse.json(feriadosAjustados);
  } catch (error: any) {
    console.error('Erro ao buscar feriados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar feriados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, data, tipo, regiao, descricao, recorrente } = body;

    const feriado = await prisma.feriado.create({
      data: {
        nome,
        data: new Date(data),
        tipo: tipo || 'nacional',
        regiao,
        descricao,
        recorrente: recorrente !== false
      }
    });

    return NextResponse.json(feriado);
  } catch (error: any) {
    console.error('Erro ao criar feriado:', error);
    return NextResponse.json(
      { error: 'Erro ao criar feriado' },
      { status: 500 }
    );
  }
}