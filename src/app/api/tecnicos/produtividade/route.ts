import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { resolveActiveServiceStationId } from "@/lib/station-selection";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const activeStationId = resolveActiveServiceStationId(req, access);
    const stationIds = activeStationId 
      ? [activeStationId] 
      : (access.isAdmin ? [] : (access.allowedStationIds.length ? access.allowedStationIds : [-1]));

    const whereStation: Prisma.TecnicoWhereInput = {};
    if (stationIds.length > 0) {
      whereStation.serviceStationId = { in: stationIds };
    }

    const tecnicos = await prisma.tecnico.findMany({
      where: {
        ativo: true,
        ...whereStation,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        serviceStation: {
          select: {
            nome: true,
            codigo: true,
          }
        }
      }
    });

    const whereOS: Prisma.OrdemServicoWhereInput = { status: "concluida" };
    if (stationIds.length > 0) {
      whereOS.serviceStationId = { in: stationIds };
    }

    const completedOrders = await prisma.ordemServico.findMany({
      where: whereOS,
      select: {
        id: true,
        tecnicoId: true,
        durationMinutes: true,
        ordemServicoTempos: {
          select: {
            durationMinutes: true,
            tecnicoId: true,
          }
        }
      }
    });

    // Aggregate stats in memory
    const statsMap = new Map<number, { completedCount: number; totalMinutes: number }>();

    for (const tech of tecnicos) {
      statsMap.set(tech.id, { completedCount: 0, totalMinutes: 0 });
    }

    for (const order of completedOrders) {
      const techId = order.tecnicoId;
      if (techId && statsMap.has(techId)) {
        const stats = statsMap.get(techId)!;
        stats.completedCount += 1;
        
        // Sum logged times
        const loggedMinutes = order.ordemServicoTempos
          .filter((t) => t.tecnicoId === techId)
          .reduce((sum, t) => sum + t.durationMinutes, 0);

        // Fallback to order durationMinutes if no time records logged
        const actualMinutes = loggedMinutes > 0 ? loggedMinutes : (order.durationMinutes || 210);
        stats.totalMinutes += actualMinutes;
      }
    }

    const result = tecnicos.map((tech) => {
      const stats = statsMap.get(tech.id) || { completedCount: 0, totalMinutes: 0 };
      const avgMinutes = stats.completedCount > 0 ? Math.round(stats.totalMinutes / stats.completedCount) : 0;
      return {
        id: tech.id,
        nome: tech.nome,
        email: tech.email,
        estacao: tech.serviceStation?.nome || "Sem Estação",
        estacaoCodigo: tech.serviceStation?.codigo || "",
        completedCount: stats.completedCount,
        totalHours: parseFloat((stats.totalMinutes / 60).toFixed(1)),
        avgMinutes,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Erro ao obter produtividade dos técnicos:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
