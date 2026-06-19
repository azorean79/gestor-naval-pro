import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function isClosedStatus(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída" || value === "cancelada";
}

export async function GET() {
  try {
    const [rows, byStatus, byTecnico] = await Promise.all([
      prisma.ordemServico.findMany({
        select: {
          id: true,
          status: true,
          tecnicoResponsavel: true,
          dataPlaneadaFim: true,
          dataAbertura: true,
          dataConclusao: true,
        },
      }),
      prisma.ordemServico.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.ordemServico.groupBy({
        by: ["tecnicoResponsavel"],
        _count: { _all: true },
      }),
    ]);

    const now = new Date();
    const delayed = rows.filter((row) => {
      if (isClosedStatus(row.status)) return false;
      if (!row.dataPlaneadaFim) return false;
      return row.dataPlaneadaFim.getTime() < now.getTime();
    }).length;

    const leadTimeMinutes = rows
      .filter((row) => row.dataConclusao && row.dataAbertura)
      .map((row) => {
        const opened = row.dataAbertura?.getTime() || 0;
        const closed = row.dataConclusao?.getTime() || 0;
        return Math.max(0, Math.round((closed - opened) / (1000 * 60)));
      })
      .filter((minutes) => minutes > 0);

    const leadTimeMedioMinutos = leadTimeMinutes.length > 0
      ? Math.round(leadTimeMinutes.reduce((acc, value) => acc + value, 0) / leadTimeMinutes.length)
      : null;

    return NextResponse.json({
      total: rows.length,
      delayed,
      leadTimeMedioMinutos,
      byStatus: byStatus.map((row) => ({ status: row.status, total: row._count._all })),
      byTecnico: byTecnico
        .map((row) => ({ tecnico: row.tecnicoResponsavel || "Sem técnico", total: row._count._all }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao calcular KPIs de ordens de serviço.");
  }
}
