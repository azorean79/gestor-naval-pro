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
    select: {
      id: true,
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const coleteId = parseInt(params.id, 10);

    const verificacoes = await prisma.verificacaoColete.findMany({
      where: { coleteId },
      orderBy: { dataVerificacao: "desc" },
    });

    return NextResponse.json(verificacoes);
  } catch (error) {
    console.error("Error fetching verificacoes:", error);
    return NextResponse.json(
      { message: "Error fetching verificacoes" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const coleteId = parseInt(params.id, 10);
    const body = await req.json();

    // Validate colete exists
    const colete = await prisma.colete.findUnique({
      where: { id: coleteId },
      select: { id: true },
    });

    if (!colete) {
      return NextResponse.json(
        { message: "Colete not found" },
        { status: 404 }
      );
    }

    const dataVerificacao = body.dataVerificacao ? new Date(body.dataVerificacao) : new Date();

    // Create verification record
    const verificacao = await prisma.verificacaoColete.create({
      data: {
        coleteId,
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

    return NextResponse.json(verificacao, { status: 201 });
  } catch (error) {
    console.error("Error creating verificacao:", error);
    return NextResponse.json(
      { message: "Error creating verificacao" },
      { status: 500 }
    );
  }
}
