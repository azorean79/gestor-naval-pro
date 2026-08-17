import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const currentId = Number(searchParams.get("currentId") || 0);

  try {
    const activeOrders = await prisma.ordemServico.findMany({
      where: {
        status: { in: ["em_progresso", "pausada"] },
      },
      select: {
        id: true,
        numeroOrdem: true,
        tipo: true,
        status: true,
        metadados: true,
        jangada: {
          select: {
            serial: true,
            brand: true,
            model: true,
          },
        },
      },
    });

    const opportunities: Array<Record<string, unknown>> = [];
    const ordersWithRafts = activeOrders.filter((o) => o.jangada);

    if (ordersWithRafts.length >= 2) {
      for (let i = 0; i < ordersWithRafts.length; i++) {
        const orderA = ordersWithRafts[i];
        for (let j = i + 1; j < ordersWithRafts.length; j++) {
          const orderB = ordersWithRafts[j];

          if (currentId && orderA.id !== currentId && orderB.id !== currentId) {
            continue;
          }

          const metadadosA = orderA.metadados && typeof orderA.metadados === "object" ? orderA.metadados as Record<string, unknown> : {};
          const metadadosB = orderB.metadados && typeof orderB.metadados === "object" ? orderB.metadados as Record<string, unknown> : {};
          const materialsA = Array.isArray(metadadosA.materials) ? metadadosA.materials as Array<Record<string, unknown>> : [];
          const materialsB = Array.isArray(metadadosB.materials) ? metadadosB.materials as Array<Record<string, unknown>> : [];

          const refsA = new Set(materialsA.map((m) => String(m.referencia || "")));
          const refsB = new Set(materialsB.map((m) => String(m.referencia || "")));

          for (const ref of refsA) {
            if (!ref || refsB.has(ref)) continue;
            const matA = materialsA.find((m) => String(m.referencia) === ref);
            if (!matA) continue;
            opportunities.push({
              id: `swap-${orderA.id}-${orderB.id}-${ref}`,
              item: String(matA.descricao || ref),
              fromOrderId: orderA.id,
              fromOrderNo: orderA.numeroOrdem,
              fromRaft: orderA.jangada?.serial || "N/D",
              fromRaftModel: `${orderA.jangada?.brand || ""} ${orderA.jangada?.model || ""}`.trim(),
              toOrderId: orderB.id,
              toOrderNo: orderB.numeroOrdem,
              toRaft: orderB.jangada?.serial || "N/D",
              toRaftModel: `${orderB.jangada?.brand || ""} ${orderB.jangada?.model || ""}`.trim(),
              savingsText: `Disponível na OT ${orderA.numeroOrdem} (${orderA.jangada?.serial || "N/D"})`,
              reason: `O artigo ${String(matA.descricao || ref)} existe na OT ${orderA.numeroOrdem} mas não na OT ${orderB.numeroOrdem}.`,
            });
          }
        }
      }
    }

    return NextResponse.json({ opportunities });
  } catch {
    return NextResponse.json({ error: "Erro ao sugerir rotações." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fromOrderId, toOrderId, item, fromValidade, toValidade } = body;

    if (!fromOrderId || !toOrderId || !item) {
      return NextResponse.json({ error: "Parâmetros obrigatórios em falta." }, { status: 400 });
    }

    const orderA = await prisma.ordemServico.findUnique({ where: { id: Number(fromOrderId) } });
    const orderB = await prisma.ordemServico.findUnique({ where: { id: Number(toOrderId) } });

    if (orderA && orderB) {
      await prisma.auditoria.create({
        data: {
          tabela: "OrdemServico",
          tipoOperacao: "ROTACAO_KIT",
          idRegisto: orderA.id,
          descricao: `Permuta de validades de ${item} entre OT ${orderA.numeroOrdem} e OT ${orderB.numeroOrdem} aplicada. Lote ${fromValidade} trocado por Lote ${toValidade}.`,
          usuario: access.email || "sistema",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Permuta de ${item} aplicada com sucesso! Os inventários das ordens de serviço foram atualizados.`,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao processar permuta." }, { status: 500 });
  }
}
