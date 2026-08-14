import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await request.json();
    const { nome, referencia, tipo, dataCalibracao, dataProxCalibracao, certificadoNum, observacoes, ativo, certificadoUrl } = body;

    const equip = await prisma.calibracaoEquipamento.update({
      where: { id },
      data: {
        nome: nome ? String(nome).trim() : undefined,
        referencia: referencia ? String(referencia).trim() : undefined,
        tipo: tipo ? String(tipo).trim() : undefined,
        dataCalibracao: dataCalibracao ? new Date(dataCalibracao) : undefined,
        dataProxCalibracao: dataProxCalibracao ? new Date(dataProxCalibracao) : undefined,
        certificadoNum: certificadoNum !== undefined ? (certificadoNum ? String(certificadoNum).trim() : null) : undefined,
        certificadoUrl: certificadoUrl !== undefined ? (certificadoUrl ? String(certificadoUrl).trim() : null) : undefined,
        ativo: ativo !== undefined ? !!ativo : undefined,
        observacoes: observacoes !== undefined ? (observacoes ? String(observacoes).trim() : null) : undefined,
      },
    });

    return NextResponse.json(equip);
  } catch (error) {
    console.error('Error updating calibration equipment:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error updating calibration equipment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.calibracaoEquipamento.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting calibration equipment:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error deleting calibration equipment' }, { status: 500 });
  }
}
