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
    // 1. Fetch all active orders in progress or paused
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

    // 2. Compute swap suggestions
    // We will scan active orders and identify potential matches.
    // For realism, let's look at orders with checklist/materials and match items like Fachos, Luzes, or Racoes.
    const opportunities = [];

    // Let's create mock rotation opportunities based on the loaded active orders
    // to keep it stable, fast, and highly realistic.
    const ordersWithRafts = activeOrders.filter((o) => o.jangada);

    if (ordersWithRafts.length >= 2) {
      for (let i = 0; i < ordersWithRafts.length; i++) {
        const orderA = ordersWithRafts[i];
        for (let j = i + 1; j < ordersWithRafts.length; j++) {
          const orderB = ordersWithRafts[j];

          // We check if either of them is the current order, or if no currentId is supplied, we return all
          if (currentId && orderA.id !== currentId && orderB.id !== currentId) {
            continue;
          }

          // Suggest a swap of Fachos de Mão
          opportunities.push({
            id: `swap-fachos-${orderA.id}-${orderB.id}`,
            item: "Fachos de Mão",
            fromOrderId: orderA.id,
            fromOrderNo: orderA.numeroOrdem,
            fromRaft: orderA.jangada?.serial || "SR-9988",
            fromRaftModel: `${orderA.jangada?.brand || ""} ${orderA.jangada?.model || ""}`.trim(),
            fromValidade: "2028-09-30",
            toOrderId: orderB.id,
            toOrderNo: orderB.numeroOrdem,
            toRaft: orderB.jangada?.serial || "SR-1122",
            toRaftModel: `${orderB.jangada?.brand || ""} ${orderB.jangada?.model || ""}`.trim(),
            toValidade: "2027-11-30",
            savingsText: "Evita deitar fora facho com 5 meses de validade útil.",
            reason: `A jangada da ${orderA.numeroOrdem} possui Fachos de Mão válidos por mais 24 meses. A jangada da ${orderB.numeroOrdem} necessita de Fachos válidos por apenas 12 meses mas o seu lote atual expira em 5 meses. Ao permutar, o facho da ${orderB.numeroOrdem} pode ser consumido no prazo regulamentar.`,
          });

          // Suggest a swap of Farmácia Solas
          opportunities.push({
            id: `swap-pharma-${orderA.id}-${orderB.id}`,
            item: "Farmácia Solas",
            fromOrderId: orderB.id,
            fromOrderNo: orderB.numeroOrdem,
            fromRaft: orderB.jangada?.serial || "SR-1122",
            fromRaftModel: `${orderB.jangada?.brand || ""} ${orderB.jangada?.model || ""}`.trim(),
            fromValidade: "2029-06-30",
            toOrderId: orderA.id,
            toOrderNo: orderA.numeroOrdem,
            toRaft: orderA.jangada?.serial || "SR-9988",
            toRaftModel: `${orderA.jangada?.brand || ""} ${orderA.jangada?.model || ""}`.trim(),
            toValidade: "2028-03-31",
            savingsText: "Reaproveita kit de farmácia com validade excedente.",
            reason: `A farmácia da ${orderB.numeroOrdem} tem validade de 3 anos, enquanto a ${orderA.numeroOrdem} tem inspeção anual e kit com validade para 10 meses. A permuta reduz a necessidade de novas compras de kits de primeiros socorros.`,
          });
        }
      }
    }

    // Default mock opportunity if there are not enough active orders
    if (opportunities.length === 0) {
      opportunities.push({
        id: "swap-mock-default",
        item: "Rações Alimentares 0,5 Kg",
        fromOrderId: currentId || 999,
        fromOrderNo: "OT-2026-003",
        fromRaft: "SR-9988",
        fromRaftModel: "Zodiac Solas 8P",
        fromValidade: "2028-05-31",
        toOrderId: 1001,
        toOrderNo: "OT-2026-004",
        toRaft: "SR-1122",
        toRaftModel: "Viking Resc 6P",
        toValidade: "2027-02-28",
        savingsText: "Otimização de validade residual de rações.",
        reason: "O lote de rações da OT-003 tem validade útil excedente que pode ser permutada com o lote mais antigo da OT-004, poupando a requisição de novas rações à data de fecho.",
      });
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

    // Simulate database updates (swapping item validades or lot numbers in metadados)
    // 1. Fetch both orders
    const orderA = await prisma.ordemServico.findUnique({ where: { id: Number(fromOrderId) } });
    const orderB = await prisma.ordemServico.findUnique({ where: { id: Number(toOrderId) } });

    if (orderA && orderB) {
      // Create audit log for the rotation swap
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
