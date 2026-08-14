import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

function parseDeliveredAt(raw: string | null | undefined): string | null {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed && typeof parsed === "object" && typeof parsed.deliveredAt === "string" && parsed.deliveredAt) {
      return parsed.deliveredAt;
    }
  } catch {
    // observações legadas em texto simples
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const jangada = await prisma.jangada.findUnique({
      where: { id },
      select: {
        id: true,
        serial: true,
        brand: true,
        model: true,
        shipNameManual: true,
        owner: true,
        serviceStationId: true,
      },
    });

    if (!jangada) {
      return NextResponse.json({ error: "Jangada não encontrada." }, { status: 404 });
    }

    const orderSelect = {
      id: true,
      numeroOrdem: true,
      status: true,
      orcamentoStatus: true,
      valorTotal: true,
      valorPecas: true,
      valorMaoObra: true,
      dataAbertura: true,
      dataConclusao: true,
      createdAt: true,
    } as const;

    const [queueRows, directOrders, inspections, linkedLinks] = await Promise.all([
      prisma.serviceStationQueue.findMany({
        where: { jangadaId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          serviceStation: { select: { id: true, codigo: true, nome: true } },
          ordemServico: { select: { id: true, numeroOrdem: true, status: true } },
        },
      }),
      prisma.ordemServico.findMany({
        where: { jangadaId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: orderSelect,
      }),
      prisma.inspecao.findMany({
        where: { jangadaId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          certificadoNumero: true,
          dataInspecao: true,
          dataProxInspecao: true,
          status: true,
          navioNome: true,
          createdAt: true,
        },
      }),
      prisma.ordemServicoJangada.findMany({
        where: { jangadaId: id },
        orderBy: [{ addedAt: "desc" }],
        include: { ordemServico: { select: orderSelect } },
      }),
    ]);

    const ordersById = new Map<number, (typeof directOrders)[number]>();
    directOrders.forEach((order) => ordersById.set(order.id, order));
    linkedLinks.forEach((link) => {
      if (link.ordemServico && !ordersById.has(link.ordemServico.id)) {
        ordersById.set(link.ordemServico.id, link.ordemServico);
      }
    });

    const ordens = Array.from(ordersById.values()).sort((a, b) => {
      const aTime = a.dataAbertura?.getTime() || a.createdAt.getTime();
      const bTime = b.dataAbertura?.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });

    const rececoes = queueRows.map((row) => ({
      queueId: row.id,
      status: row.status,
      deliveredAt: parseDeliveredAt(row.observacoes),
      dataChegada: row.dataChegada.toISOString(),
      dataPrevistaEntrega: row.dataPrevistaEntrega?.toISOString() || null,
      estacao: row.serviceStation
        ? `${row.serviceStation.codigo || ""} · ${row.serviceStation.nome || ""}`.trim()
        : null,
      numeroOrdem: row.ordemServico?.numeroOrdem || null,
      ordemStatus: row.ordemServico?.status || null,
    }));

    return NextResponse.json({
      jangada: {
        id: jangada.id,
        serial: jangada.serial,
        brand: jangada.brand,
        model: jangada.model,
        shipNameManual: jangada.shipNameManual,
        owner: jangada.owner,
      },
      rececoes,
      ordens: ordens.map((order) => ({
        id: order.id,
        numeroOrdem: order.numeroOrdem,
        status: order.status,
        orcamentoStatus: order.orcamentoStatus,
        valorTotal: Number(order.valorTotal || 0),
        valorPecas: Number(order.valorPecas || 0),
        valorMaoObra: Number(order.valorMaoObra || 0),
        dataAbertura: order.dataAbertura.toISOString(),
        dataConclusao: order.dataConclusao?.toISOString() || null,
      })),
      inspecoes: inspections.map((inspection) => ({
        id: inspection.id,
        certificadoNumero: inspection.certificadoNumero,
        dataInspecao: inspection.dataInspecao,
        dataProxInspecao: inspection.dataProxInspecao,
        status: inspection.status,
        navioNome: inspection.navioNome,
      })),
    });
  } catch (error: unknown) {
    console.error("Erro ao obter histórico da jangada:", error);
    const message = error instanceof Error ? error.message : "Erro ao obter o histórico da jangada.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}