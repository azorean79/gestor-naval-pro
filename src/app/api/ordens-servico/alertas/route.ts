import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseOrdemServicoMeta } from "@/lib/ordens-servico";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

type AlertSeverity = "info" | "warning" | "critical";
type AlertType = "delayed" | "running_too_long" | "stock_insufficient";

type OperationalAlert = {
  id: string;
  ordemServicoId: number;
  numeroOrdem: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  recommendation: string;
  href: string;
  status: string;
  prioridade: string;
  tecnicoResponsavel: string | null;
  clienteNome: string | null;
  jangadaSerial: string | null;
  plannedEnd: string | null;
  activeSince: string | null;
  metricValue: number;
  refs: string[];
};

function isClosedStatus(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída" || value === "cancelada";
}

function severityRank(severity: AlertSeverity) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const tecnicoFilter = searchParams.get("tecnico")?.trim() || "";

    const where: Prisma.OrdemServicoWhereInput = {
      status: { notIn: ["concluida", "cancelada"] },
    };
    if (tecnicoFilter) {
      where.tecnicoResponsavel = { contains: tecnicoFilter };
    }

    const rows = await prisma.ordemServico.findMany({
      where,
      select: {
        id: true,
        numeroOrdem: true,
        status: true,
        prioridade: true,
        tecnicoResponsavel: true,
        durationMinutes: true,
        dataPlaneadaFim: true,
        metadados: true,
        cliente: {
          select: {
            nome: true,
          },
        },
        jangada: {
          select: {
            serial: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const now = Date.now();
    const alerts: OperationalAlert[] = [];

    for (const row of rows) {
      if (isClosedStatus(row.status)) continue;

      const meta = parseOrdemServicoMeta(row.metadados);
      const href = `/ordens-servico/${row.id}`;
      const clienteNome = row.cliente?.nome || null;
      const jangadaSerial = row.jangada?.serial || null;

      if (row.dataPlaneadaFim) {
        const overdueMinutes = Math.max(0, Math.ceil((now - row.dataPlaneadaFim.getTime()) / (1000 * 60)));
        if (overdueMinutes > 0) {
          const severity: AlertSeverity = overdueMinutes >= 24 * 60 ? "critical" : "warning";
          alerts.push({
            id: `delayed-${row.id}`,
            ordemServicoId: row.id,
            numeroOrdem: row.numeroOrdem,
            severity,
            type: "delayed",
            title: severity === "critical" ? "OT criticamente atrasada" : "OT em atraso",
            description: `Planeada para terminar há ${Math.ceil(overdueMinutes / 60)}h e continua aberta.`,
            recommendation: "Replanear técnico, atualizar o estado real ou concluir a OT se já estiver terminada.",
            href,
            status: row.status,
            prioridade: row.prioridade,
            tecnicoResponsavel: row.tecnicoResponsavel || null,
            clienteNome,
            jangadaSerial,
            plannedEnd: row.dataPlaneadaFim.toISOString(),
            activeSince: null,
            metricValue: overdueMinutes,
            refs: [],
          });
        }
      }

      const timeEntries = Array.isArray(meta.timeEntries) ? meta.timeEntries : [];
      const activeTimeEntry = timeEntries.find((entry) => entry && entry.startedAt && !entry.endedAt);
      if (activeTimeEntry?.startedAt) {
        const startedAtMs = new Date(String(activeTimeEntry.startedAt)).getTime();
        if (Number.isFinite(startedAtMs)) {
          const elapsedMinutes = Math.max(0, Math.ceil((now - startedAtMs) / (1000 * 60)));
          const expectedMinutes = Math.max(60, Number(row.durationMinutes || 0) || 210);
          if (elapsedMinutes > expectedMinutes) {
            const overrunMinutes = elapsedMinutes - expectedMinutes;
            const severity: AlertSeverity = overrunMinutes >= 120 ? "critical" : "warning";
            alerts.push({
              id: `running-${row.id}`,
              ordemServicoId: row.id,
              numeroOrdem: row.numeroOrdem,
              severity,
              type: "running_too_long",
              title: severity === "critical" ? "Execução muito acima do previsto" : "Execução prolongada",
              description: `Registo ativo há ${Math.ceil(elapsedMinutes / 60)}h para uma OT prevista em ${Math.ceil(expectedMinutes / 60)}h.`,
              recommendation: "Validar se a execução ficou aberta por engano, se a carga deve ser repartida ou se a estimativa precisa revisão.",
              href,
              status: row.status,
              prioridade: row.prioridade,
              tecnicoResponsavel: row.tecnicoResponsavel || null,
              clienteNome,
              jangadaSerial,
              plannedEnd: row.dataPlaneadaFim?.toISOString() || null,
              activeSince: String(activeTimeEntry.startedAt),
              metricValue: overrunMinutes,
              refs: [],
            });
          }
        }
      }

      const materials = Array.isArray(meta.materials) ? meta.materials : [];
      const shortages = materials.filter((item) => {
        if (!item || item.consumido) return false;
        const required = Math.max(1, Number(item.quantidadeUsada ?? item.quantidadePrevista ?? 0));
        const available = Number(item.disponibilidade ?? 0);
        return available < required;
      });

      if (shortages.length > 0) {
        const missingRefs = shortages
          .map((item) => String(item.referencia || item.descricao || "").trim())
          .filter(Boolean)
          .slice(0, 5);
        const maxGap = Math.max(
          ...shortages.map((item) => {
            const required = Math.max(1, Number(item.quantidadeUsada ?? item.quantidadePrevista ?? 0));
            const available = Number(item.disponibilidade ?? 0);
            return required - available;
          })
        );
        const severity: AlertSeverity = maxGap >= 2 || shortages.some((item) => Number(item.disponibilidade ?? 0) <= 0) ? "critical" : "warning";

        alerts.push({
          id: `stock-${row.id}`,
          ordemServicoId: row.id,
          numeroOrdem: row.numeroOrdem,
          severity,
          type: "stock_insufficient",
          title: severity === "critical" ? "Stock insuficiente bloqueante" : "Stock insuficiente na OT",
          description: `${shortages.length} material(is) sem disponibilidade suficiente para a execução.`,
          recommendation: "Reservar substitutos, corrigir quantidades previstas ou repor stock antes de continuar a intervenção.",
          href,
          status: row.status,
          prioridade: row.prioridade,
          tecnicoResponsavel: row.tecnicoResponsavel || null,
          clienteNome,
          jangadaSerial,
          plannedEnd: row.dataPlaneadaFim?.toISOString() || null,
          activeSince: null,
          metricValue: shortages.length,
          refs: missingRefs,
        });
      }
    }

    // General critical stock alerts
    try {
      const criticalStock = await prisma.stock.findMany({
        where: { estadoArtigo: "ATIVO" },
        select: { id: true, referencia: true, descricao: true, quantidade: true, quantidadeMinima: true },
        orderBy: [{ quantidade: "asc" }],
      });
      const lowItems = criticalStock.filter((item) => {
        if (item.quantidade === 0) return true;
        const min = item.quantidadeMinima || 0;
        return min > 0 && item.quantidade <= min;
      });
      for (const item of lowItems.slice(0, 30)) {
        const deficit = Math.max(0, (item.quantidadeMinima || 0) - item.quantidade);
        alerts.push({
          id: `stock-critical-${item.id}`,
          ordemServicoId: -1,
          numeroOrdem: '',
          severity: deficit > 0 ? 'critical' : 'warning',
          type: 'stock_insufficient',
          title: `Stock baixo: ${item.referencia}`,
          description: `${item.descricao} — stock: ${item.quantidade}, mínimo: ${item.quantidadeMinima || 0}, défice: ${deficit}`,
          recommendation: 'Repor stock o mais breve possível.',
          href: `/stock/${item.id}`,
          status: 'aberta',
          prioridade: 'alta',
          tecnicoResponsavel: null,
          clienteNome: null,
          jangadaSerial: null,
          plannedEnd: null,
          activeSince: null,
          metricValue: deficit,
          refs: [item.referencia || ''],
        });
      }
    } catch (e) {
      console.error('[alertas] Erro ao verificar stock crítico:', e);
    }

    alerts.sort((a, b) => {
      const severityDiff = severityRank(b.severity) - severityRank(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.metricValue - a.metricValue;
    });

    const summary = {
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical").length,
      warning: alerts.filter((alert) => alert.severity === "warning").length,
      info: alerts.filter((alert) => alert.severity === "info").length,
      byType: {
        delayed: alerts.filter((alert) => alert.type === "delayed").length,
        runningTooLong: alerts.filter((alert) => alert.type === "running_too_long").length,
        stockInsufficient: alerts.filter((alert) => alert.type === "stock_insufficient").length,
      },
    };

    return NextResponse.json({ summary, alerts });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao calcular alertas operacionais de OT.");
  }
}