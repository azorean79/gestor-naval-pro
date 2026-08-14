import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, type, signatureBase64, mestreName, notes } = body;

    if (!orderId || !type || !mestreName || !signatureBase64) {
      return NextResponse.json({ error: "Parâmetros obrigatórios em falta (orderId, type, mestreName, signatureBase64)." }, { status: 400 });
    }

    // 1. Fetch existing order
    const order = await prisma.ordemServico.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });
    }

    const currentMeta = order.metadados && typeof order.metadados === "object"
      ? (order.metadados as Record<string, unknown>)
      : {};

    // 2. Merge protocol details
    const updatedMeta = {
      ...currentMeta,
      protocoloCais: {
        type,
        signatureBase64,
        mestreName,
        notes: notes || "",
        timestamp: new Date().toISOString(),
        operator: access.email || "sistema",
      },
    };

    // 3. Update order in database
    await prisma.ordemServico.update({
      where: { id: order.id },
      data: {
        metadados: JSON.stringify(updatedMeta),
      },
    });

    // 4. Log in Auditoria
    await prisma.auditoria.create({
      data: {
        tabela: "OrdemServico",
        tipoOperacao: "RECEPCAO_CAIS",
        idRegisto: order.id,
        descricao: `Protocolo de cais (${type === "check-in" ? "Recolha" : "Entrega"}) assinado pelo Mestre ${mestreName}. Notas: ${notes || "Nenhuma"}`,
        usuario: access.email || "sistema",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Protocolo de cais (${type === "check-in" ? "Recolha" : "Entrega"}) registado com sucesso!`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao processar recepção de cais.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
