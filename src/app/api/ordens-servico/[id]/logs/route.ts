import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendOrdemServicoLog, parseOrdemServicoMeta, toOrdemServicoMetaJson } from "@/lib/ordens-servico";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function parseIdFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 2];
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseOptionalPositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

export async function GET(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const rows = await prisma.ordemServicoLog.findMany({
      where: { ordemServicoId: id },
      orderBy: [{ at: "desc" }, { id: "desc" }],
      take: 200,
      select: {
        id: true,
        at: true,
        type: true,
        message: true,
        user: true,
        tecnico: {
          select: { nome: true },
        },
      },
    });

    const logs = rows.map((entry) => ({
      id: String(entry.id),
      at: entry.at?.toISOString?.() || null,
      type: entry.type || "EVENT",
      message: entry.message || "",
      user: entry.user || entry.tecnico?.nome || "sistema",
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao obter logs da OT.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Mensagem obrigatória para registar nota/log." }, { status: 400 });
    }

    const type = String(body.type || "NOTE").trim().toUpperCase().slice(0, 40) || "NOTE";
    const user = String(body.user || "").trim() || "operador";
    const tecnicoId = parseOptionalPositiveInt(body.tecnicoId);
    const at = new Date();

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      select: { id: true, metadados: true },
    });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const log = await prisma.$transaction(async (tx) => {
      const created = await tx.ordemServicoLog.create({
        data: {
          ordemServicoId: id,
          at,
          type,
          message,
          user,
          tecnicoId,
        },
        select: {
          id: true,
          at: true,
          type: true,
          message: true,
          user: true,
          tecnico: { select: { nome: true } },
        },
      });

      const meta = parseOrdemServicoMeta(order.metadados);
      const nextMeta = appendOrdemServicoLog(meta, {
        type,
        message,
        user,
        at: at.toISOString(),
      });

      await tx.ordemServico.update({
        where: { id },
        data: { metadados: toOrdemServicoMetaJson(nextMeta) },
      });

      return created;
    });

    return NextResponse.json({
      entry: {
        id: String(log.id),
        at: log.at?.toISOString?.() || null,
        type: log.type || "NOTE",
        message: log.message || "",
        user: log.user || log.tecnico?.nome || "sistema",
      },
    }, { status: 201 });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao registar nota/log da OT.");
  }
}
