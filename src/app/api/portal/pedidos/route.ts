import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";
import { generateOSNumeroOrdem } from "@/lib/ordens-servico";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão de cliente obrigatória." }, { status: 401 });
    }
    const userRole: string = session.user.role;
    if (userRole !== "CLIENTE" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Sessão de cliente obrigatória." }, { status: 401 });
    }

    const body = await req.json();

    let clienteId: number | undefined = session.user.clienteId ? Number(session.user.clienteId) : undefined;
    if (userRole !== "CLIENTE") {
      const requestedClienteId = Number(body.clienteId);
      if (Number.isFinite(requestedClienteId) && requestedClienteId > 0) {
        clienteId = requestedClienteId;
      } else if (!clienteId) {
        const firstClient = await prisma.cliente.findFirst({ select: { id: true } });
        clienteId = firstClient?.id;
      }
    }

    if (!clienteId) {
      return NextResponse.json({ error: "Utilizador não possui cliente associado." }, { status: 400 });
    }

    const { shipId, jangadaId, porto, dataPretendida, necessitaHRU, observacoes, transitario, dataEntrega, trackingCode } = body;

    if (!shipId || !porto || !dataPretendida) {
      return NextResponse.json({ error: "Campos obrigatórios em falta (shipId, porto, dataPretendida)." }, { status: 400 });
    }

    // Verify ship belongs to client (CLIENTE) or resolve client from ship (interno)
    let ship;
    if (userRole === "CLIENTE") {
      ship = await prisma.navio.findFirst({
        where: { id: Number(shipId), clienteId: Number(clienteId) }
      });
    } else {
      ship = await prisma.navio.findUnique({
        where: { id: Number(shipId) }
      });
      if (ship?.clienteId) {
        clienteId = ship.clienteId;
      }
    }

    if (!ship) {
      return NextResponse.json({ error: "Navio não encontrado ou não pertence a este cliente." }, { status: 404 });
    }

    // Verify or find jangadaId
    let resolvedJangadaId = Number(jangadaId);
    if (!resolvedJangadaId) {
      // Find first jangada of the ship
      const firstJangada = await prisma.jangada.findFirst({
        where: { shipId: ship.id }
      });
      if (!firstJangada) {
        return NextResponse.json({ error: "O navio indicado não tem jangadas registadas. Uma jangada é obrigatória para criar a ordem." }, { status: 400 });
      }
      resolvedJangadaId = firstJangada.id;
    } else {
      // Verify jangada belongs to ship
      const jangada = await prisma.jangada.findFirst({
        where: { id: resolvedJangadaId, shipId: ship.id }
      });
      if (!jangada) {
        return NextResponse.json({ error: "A jangada indicada não pertence ao navio selecionado." }, { status: 400 });
      }
    }

    // Generate unique OrdemServico number
    const dataPlaneada = new Date(dataPretendida);
    const numeroOrdem = await generateOSNumeroOrdem(dataPlaneada);

    // Build description
    const descParts = [
      `Pedido de inspeção via Portal do Cliente.`,
      `Porto de Assistência: ${porto}`,
      `Instalação de novo HRU: ${necessitaHRU === "yes" ? "Sim" : "Não"}`
    ];
    if (observacoes && String(observacoes).trim()) {
      descParts.push(`Observações: ${String(observacoes).trim()}`);
    }
    const descricao = descParts.join("\n");

    const isOtherIsland = ship.ilha && !["são miguel", "sao miguel"].includes(ship.ilha.toLowerCase());

    // Create OrdemServico and ServiceStationQueue entry in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.ordemServico.create({
        data: {
          numeroOrdem,
          shipId: ship.id,
          jangadaId: resolvedJangadaId,
          clienteId: Number(clienteId),
          tipo: "inspecao",
          prioridade: "normal",
          status: "pendente",
          descricao,
          dataPlaneadaInicio: dataPlaneada,
          metadados: JSON.stringify({
            porto,
            dataPretendida,
            necessitaHRU,
            origem: "portal_cliente",
            transitario: isOtherIsland ? transitario : undefined,
            dataEntrega: isOtherIsland ? dataEntrega : undefined,
            trackingCode: isOtherIsland ? trackingCode : undefined
          })
        }
      });

      if (isOtherIsland || transitario) {
        const station = await tx.serviceStation.findFirst({
          where: { codigo: "ACORES" }
        });
        const serviceStationId = station?.id || 1;

        const queueMeta = {
          workflowStatus: "entrada_estacao",
          arrivedViaForwarder: true,
          arrivalDate: dataEntrega || new Date().toISOString().slice(0, 10),
          transitario: transitario || "Pendente",
          trackingCode: trackingCode || "",
          deliveryMethod: "transitario",
          observacao: `Envio criado pelo cliente via Portal do Cliente. Código de Rastreio: ${trackingCode || "N/A"}`
        };

        await tx.serviceStationQueue.create({
          data: {
            jangadaId: resolvedJangadaId,
            ordemServicoId: order.id,
            serviceStationId,
            status: "aguardar",
            dataChegada: dataEntrega ? new Date(dataEntrega) : new Date(),
            observacoes: JSON.stringify(queueMeta)
          }
        });
      }

      return order;
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: unknown) {
    console.error("Erro ao criar pedido de serviço:", error);
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
