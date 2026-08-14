import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const ativo = searchParams.get('ativo');

    const where: Prisma.CalibracaoEquipamentoWhereInput = {};
    if (tipo) {
      where.tipo = tipo;
    }
    if (ativo !== null && ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    const equips = await prisma.calibracaoEquipamento.findMany({
      where,
      orderBy: { dataProxCalibracao: 'asc' },
    });

    return NextResponse.json(equips);
  } catch (error) {
    console.error('Error fetching calibration equipment:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error fetching calibration equipment' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, referencia, tipo, dataCalibracao, dataProxCalibracao, certificadoNum, observacoes, certificadoUrl } = body;

    if (!nome || !referencia || !tipo || !dataCalibracao || !dataProxCalibracao) {
      return NextResponse.json({ error: 'Falta campos obrigatórios (nome, referencia, tipo, dataCalibracao, dataProxCalibracao)' }, { status: 400 });
    }

    const equip = await prisma.calibracaoEquipamento.create({
      data: {
        nome: String(nome).trim(),
        referencia: String(referencia).trim(),
        tipo: String(tipo).trim(),
        dataCalibracao: new Date(dataCalibracao),
        dataProxCalibracao: new Date(dataProxCalibracao),
        certificadoNum: certificadoNum ? String(certificadoNum).trim() : null,
        certificadoUrl: certificadoUrl ? String(certificadoUrl).trim() : null,
        ativo: body.ativo !== false,
        observacoes: observacoes ? String(observacoes).trim() : null,
      },
    });

    return NextResponse.json(equip);
  } catch (error) {
    console.error('Error creating calibration equipment:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error creating calibration equipment' }, { status: 500 });
  }
}
