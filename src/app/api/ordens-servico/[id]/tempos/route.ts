import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendOrdemServicoLog, parseOrdemServicoMeta, toOrdemServicoMetaJson, normalizeOrdemStatus } from "@/lib/ordens-servico";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function parseIdFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 2];
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function readTimeEntries(meta: ReturnType<typeof parseOrdemServicoMeta>) {
  return Array.isArray(meta.timeEntries) ? meta.timeEntries : [];
}

function totalMinutes(entries: Array<{ durationMinutes?: number }>) {
  return entries.reduce((acc, entry) => acc + Math.max(0, Number(entry.durationMinutes || 0)), 0);
}

export async function GET(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const order = await prisma.ordemServico.findUnique({ where: { id }, select: { metadados: true } });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const meta = parseOrdemServicoMeta(order.metadados);
    const entries = readTimeEntries(meta);
    const activeEntry = entries.find((entry) => entry && !entry.endedAt) || null;

    return NextResponse.json({ entries, activeEntry, totalMinutes: totalMinutes(entries) });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao obter tempos da OT.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "").trim().toLowerCase();
    if (!["start", "stop"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida. Use start ou stop." }, { status: 400 });
    }

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      select: {
        id: true,
        numeroOrdem: true,
        status: true,
        tecnicoResponsavel: true,
        dataInicio: true,
        dataConclusao: true,
        metadados: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const meta = parseOrdemServicoMeta(order.metadados);
    const entries = readTimeEntries(meta);
    const now = new Date();
    const tecnico = String(body.tecnico || order.tecnicoResponsavel || "").trim() || "Sem técnico";

    if (action === "start") {
      const activeEntry = entries.find((entry) => entry && !entry.endedAt);
      if (activeEntry) {
        return NextResponse.json({ error: "Já existe um registo de tempo ativo nesta OT." }, { status: 400 });
      }

      const nextEntries = [
        ...entries,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tecnico,
          startedAt: now.toISOString(),
          endedAt: null,
          durationMinutes: 0,
          notes: String(body.notes || "").trim() || undefined,
        },
      ];

      const nextMeta = appendOrdemServicoLog({ ...meta, timeEntries: nextEntries }, {
        type: "TIME_START",
        message: `Execução iniciada por ${tecnico}.`,
        user: tecnico,
      });

      const updated = await prisma.ordemServico.update({
        where: { id },
        data: {
          status: normalizeOrdemStatus(body.status || "em_progresso"),
          tecnicoResponsavel: tecnico === "Sem técnico" ? order.tecnicoResponsavel : tecnico,
          dataInicio: order.dataInicio || now,
          metadados: toOrdemServicoMetaJson(nextMeta),
        },
        select: { metadados: true, durationMinutes: true, status: true, dataInicio: true, dataConclusao: true },
      });

      return NextResponse.json({ entries: nextEntries, activeEntry: nextEntries[nextEntries.length - 1], totalMinutes: totalMinutes(nextEntries), order: updated });
    }

    const activeIndex = entries.findIndex((entry) => entry && !entry.endedAt);
    if (activeIndex < 0) {
      return NextResponse.json({ error: "Não existe registo de tempo ativo para parar." }, { status: 400 });
    }

    const activeEntry = entries[activeIndex];
    const startedAt = new Date(String(activeEntry.startedAt || now.toISOString()));
    const duration = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / (1000 * 60)));
    const nextEntries = entries.map((entry, index) => (
      index === activeIndex
        ? {
            ...entry,
            endedAt: now.toISOString(),
            durationMinutes: duration,
            notes: String(body.notes || entry.notes || "").trim() || entry.notes,
          }
        : entry
    ));
    const total = totalMinutes(nextEntries);
    const nextStatus = Object.prototype.hasOwnProperty.call(body, "status") ? normalizeOrdemStatus(body.status) : (order.status === "em_progresso" ? "pausada" : order.status);
    const nextMeta = appendOrdemServicoLog({ ...meta, timeEntries: nextEntries }, {
      type: "TIME_STOP",
      message: `Execução parada (${duration} min).`,
      user: tecnico,
    });

    const updated = await prisma.ordemServico.update({
      where: { id },
      data: {
        status: nextStatus,
        durationMinutes: total,
        dataConclusao: nextStatus === "concluida" ? now : order.dataConclusao,
        metadados: toOrdemServicoMetaJson(nextMeta),
      },
      select: { metadados: true, durationMinutes: true, status: true, dataInicio: true, dataConclusao: true },
    });

    return NextResponse.json({ entries: nextEntries, activeEntry: null, totalMinutes: total, order: updated });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao registar tempo na OT.");
  }
}
