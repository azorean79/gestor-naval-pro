import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { parseOrdemServicoMeta, type OrdemServicoMeta } from "@/lib/ordens-servico";

function isClosedStatus(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída" || value === "cancelada";
}

function isConcludedStatus(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída";
}

function formatMonthLabel(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const [rows, byStatus, byPrioridade, byTecnico] = await Promise.all([
      prisma.ordemServico.findMany({
        select: {
          id: true,
          status: true,
          prioridade: true,
          tecnicoResponsavel: true,
          tecnicoId: true,
          dataPlaneadaFim: true,
          dataAbertura: true,
          dataConclusao: true,
          metadados: true,
        },
      }),
      prisma.ordemServico.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.ordemServico.groupBy({
        by: ["prioridade"],
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

    const inProgress = rows.filter((row) => !isClosedStatus(row.status));
    const concluded = rows.filter((row) => isConcludedStatus(row.status));

    const leadTimeMinutes = concluded
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

    // SLA: orders concluded before planned end
    const slaEvaluable = concluded.filter((row) => row.dataConclusao && row.dataPlaneadaFim);
    const slaOnTime = slaEvaluable.filter((row) => {
      const concludedAt = row.dataConclusao!.getTime();
      const plannedEnd = row.dataPlaneadaFim!.getTime();
      return concludedAt <= plannedEnd;
    });
    const slaCompliancePercent = slaEvaluable.length > 0
      ? Math.round((slaOnTime.length / slaEvaluable.length) * 100)
      : null;

    // Financial value from rich orcamento metadata
    let totalValueInProgress = 0;
    let totalValueConcluded = 0;
    for (const row of rows) {
      const meta = parseOrdemServicoMeta(row.metadados) as OrdemServicoMeta & {
        orcamento?: { totais?: Record<string, number> };
      };
      const total = Number(meta.orcamento?.totais?.total ?? meta.totais?.totalComIva ?? 0);
      if (total > 0) {
        if (isClosedStatus(row.status)) {
          totalValueConcluded += total;
        } else {
          totalValueInProgress += total;
        }
      }
    }

    // OTs by month (abertura)
    const monthMap = new Map<string, number>();
    const last12Months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = formatMonthLabel(d);
      last12Months.push(label);
      monthMap.set(label, 0);
    }
    for (const row of rows) {
      if (row.dataAbertura) {
        const label = formatMonthLabel(row.dataAbertura);
        if (monthMap.has(label)) {
          monthMap.set(label, (monthMap.get(label) || 0) + 1);
        }
      }
    }

    return NextResponse.json({
      total: rows.length,
      open: inProgress.length,
      concluded: concluded.length,
      delayed,
      leadTimeMedioMinutos,
      leadTimeMedioDias: leadTimeMedioMinutos ? Math.round((leadTimeMedioMinutos / (60 * 24)) * 10) / 10 : null,
      slaCompliancePercent,
      totalValueInProgress,
      totalValueConcluded,
      byStatus: byStatus.map((row) => ({ status: row.status, total: row._count._all })),
      byPrioridade: byPrioridade.map((row) => ({ prioridade: row.prioridade, total: row._count._all })),
      byTecnico: byTecnico
        .map((row) => ({ tecnico: row.tecnicoResponsavel || "Sem técnico", total: row._count._all }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      byMonth: last12Months.map((label) => ({ label, total: monthMap.get(label) || 0 })),
    });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao calcular KPIs de ordens de serviço.");
  }
}
