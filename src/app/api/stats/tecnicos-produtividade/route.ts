import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all completed or running work orders
    const orders = await prisma.ordemServico.findMany({
      include: {
        tecnico: true,
        jangada: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
    });

    // Grouping structure
    const statsMap = new Map<
      string,
      {
        tecnicoId: number | null;
        nome: string;
        totalOrdens: number;
        totalConcluidas: number;
        totalPendente: number;
        leadTimesMinutes: number[];
        brandDistribution: Record<string, number>;
      }
    >();

    orders.forEach((o) => {
      // Use technician name or "Não Atribuído"
      const nomeTecnico = o.tecnico?.nome || o.tecnicoResponsavel || "Não Atribuído";
      const key = o.tecnicoId ? `id_${o.tecnicoId}` : `name_${nomeTecnico}`;

      let stats = statsMap.get(key);
      if (!stats) {
        stats = {
          tecnicoId: o.tecnicoId,
          nome: nomeTecnico,
          totalOrdens: 0,
          totalConcluidas: 0,
          totalPendente: 0,
          leadTimesMinutes: [],
          brandDistribution: {},
        };
        statsMap.set(key, stats);
      }

      stats.totalOrdens++;

      // Concluída check
      const statusLower = String(o.status || "").toLowerCase();
      const isConcluida = statusLower === "concluida" || statusLower === "concluída" || statusLower === "finalizada";

      if (isConcluida) {
        stats.totalConcluidas++;

        // Lead-time calculation (minutes)
        if (o.dataInicio && o.dataConclusao) {
          const diffMs = o.dataConclusao.getTime() - o.dataInicio.getTime();
          const diffMin = Math.max(1, Math.round(diffMs / (1000 * 60)));
          stats.leadTimesMinutes.push(diffMin);
        } else if (o.durationMinutes && o.durationMinutes > 0) {
          stats.leadTimesMinutes.push(o.durationMinutes);
        }
      } else {
        stats.totalPendente++;
      }

      // Brand distribution
      if (o.jangada?.brand) {
        const brand = o.jangada.brand.trim();
        stats.brandDistribution[brand] = (stats.brandDistribution[brand] || 0) + 1;
      }
    });

    const results = Array.from(statsMap.values()).map((s) => {
      const avgLeadTimeMinutes = s.leadTimesMinutes.length > 0
        ? Math.round(s.leadTimesMinutes.reduce((a, b) => a + b, 0) / s.leadTimesMinutes.length)
        : 0;

      // Format average lead time to hours/minutes representation
      let leadTimeLabel = "—";
      if (avgLeadTimeMinutes > 0) {
        const hrs = Math.floor(avgLeadTimeMinutes / 60);
        const mins = avgLeadTimeMinutes % 60;
        leadTimeLabel = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}min`;
      }

      return {
        tecnicoId: s.tecnicoId,
        nome: s.nome,
        totalOrdens: s.totalOrdens,
        totalConcluidas: s.totalConcluidas,
        totalPendente: s.totalPendente,
        avgLeadTimeMinutes,
        leadTimeLabel,
        brandDistribution: s.brandDistribution,
      };
    });

    // Sort by total completed orders descending
    results.sort((a, b) => b.totalConcluidas - a.totalConcluidas);

    return NextResponse.json({
      success: true,
      tecnicos: results,
      totalOrdensGeral: orders.length,
    });
  } catch (error) {
    console.error("Error fetching technician productivity:", error);
    return NextResponse.json({ error: "Erro ao carregar estatísticas dos técnicos." }, { status: 500 });
  }
}
