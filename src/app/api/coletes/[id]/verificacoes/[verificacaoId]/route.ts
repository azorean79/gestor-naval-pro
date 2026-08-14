import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function syncColeteInspectionCycle(coleteId: number) {
  const latestVerification = await prisma.verificacaoColete.findFirst({
    where: { coleteId },
    orderBy: [{ dataVerificacao: "desc" }, { id: "desc" }],
    select: { dataVerificacao: true },
  });

  if (!latestVerification?.dataVerificacao) {
    return;
  }

  const dataInspecaoIso = latestVerification.dataVerificacao.toISOString().slice(0, 10);
  const dataProx = new Date(latestVerification.dataVerificacao);
  dataProx.setFullYear(dataProx.getFullYear() + 1);
  const dataProxIso = dataProx.toISOString().slice(0, 10);

  await prisma.colete.update({
    where: { id: coleteId },
    data: {
      dataInspecao: dataInspecaoIso,
      dataProxInspecao: dataProxIso,
    },
    select: { id: true },
  });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; verificacaoId: string }> }
) {
  try {
    const params = await context.params;
    const coleteId = parseInt(params.id, 10);
    const verificacaoId = parseInt(params.verificacaoId, 10);
    const body = await req.json();

    if (!coleteId || !verificacaoId) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    const existingVerification = await prisma.verificacaoColete.findFirst({
      where: {
        id: verificacaoId,
        coleteId,
      },
      select: {
        id: true,
        dataVerificacao: true,
      },
    });

    if (!existingVerification) {
      return NextResponse.json(
        { message: "Verificação não encontrada" },
        { status: 404 }
      );
    }

    const dataVerificacao = body.dataVerificacao
      ? new Date(body.dataVerificacao)
      : existingVerification.dataVerificacao;

    const verificacao = await prisma.verificacaoColete.update({
      where: { id: verificacaoId },
      data: {
        tecidoExterior: body.tecidoExterior || null,
        colagens: body.colagens || null,
        zataosVelcro: body.zataosVelcro || null,
        fitasReflectoras: body.fitasReflectoras || null,
        sistemaInflacao: body.sistemaInflacao || null,
        mecanismoInflacao: body.mecanismoInflacao || null,
        camaras: body.camaras || null,
        garrafaCO2: body.garrafaCO2 || null,
        tuboInflador: body.tuboInflador || null,
        dataVerificacao,
        inspectorNome: body.inspectorNome || null,
        observacoes: body.observacoes || null,
      },
    });

    await syncColeteInspectionCycle(coleteId);

    return NextResponse.json(verificacao);
  } catch (error) {
    console.error("Error updating verificacao:", error);
    return NextResponse.json(
      { message: "Error updating verificacao" },
      { status: 500 }
    );
  }
}