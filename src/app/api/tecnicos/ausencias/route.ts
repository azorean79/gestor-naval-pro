import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { getTechnicianKeyByName, getTechnicianNameByKey } from "@/lib/agenda-technicians";

type AusenciaTipo = "ferias" | "ausencia";

function normalizeTipo(value: unknown): AusenciaTipo {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "ferias" ? "ferias" : "ausencia";
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function parseDateInput(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function normalizeTeckey(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return getTechnicianKeyByName(raw) || "";
}

type AusenciaRow = {
  id?: number;
  tecnicoKey?: string;
  tecnicoId?: number | null;
  tipo?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  motivo?: string | null;
};

function getTecnicoAusenciaModel() {
  const model = (prisma as unknown as { tecnicoAusencia?: unknown }).tecnicoAusencia;
  return model as
    | {
        findMany?: (args: unknown) => Promise<unknown[]>;
        create?: (args: unknown) => Promise<unknown>;
        findUnique?: (args: unknown) => Promise<unknown>;
        delete?: (args: unknown) => Promise<unknown>;
      }
    | undefined;
}

export async function GET(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const model = getTecnicoAusenciaModel();
    if (!model?.findMany) {
      return NextResponse.json({ ausencias: [] });
    }

    const searchParams = req.nextUrl.searchParams;
    const tecnicoKey = normalizeTeckey(searchParams.get("tecnicoKey") || searchParams.get("tecnicoNome") || "");

    const startQuery = parseDateInput(searchParams.get("start"));
    const endQuery = parseDateInput(searchParams.get("end"));

    const where: {
      tecnicoKey?: string;
      dataFim?: { gte: Date };
      dataInicio?: { lte: Date };
    } = {};

    if (tecnicoKey) where.tecnicoKey = tecnicoKey;
    if (startQuery) where.dataFim = { gte: startOfDay(startQuery) };
    if (endQuery) where.dataInicio = { lte: endOfDay(endQuery) };

    const ausencias = await model.findMany({
      where,
      orderBy: [{ dataInicio: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      ausencias: ausencias.map((entry) => {
        const item = (entry ?? {}) as AusenciaRow;
        return {
          id: Number(item?.id || 0),
          tecnicoKey: String(item?.tecnicoKey || ""),
          tecnicoNome: getTechnicianNameByKey(item?.tecnicoKey) || String(item?.tecnicoKey || ""),
          tipo: String(item?.tipo || "ausencia"),
          dataInicio: item?.dataInicio instanceof Date ? item.dataInicio.toISOString() : String(item?.dataInicio || ""),
          dataFim: item?.dataFim instanceof Date ? item.dataFim.toISOString() : String(item?.dataFim || ""),
          motivo: item?.motivo || null,
          tecnicoId: item?.tecnicoId ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao listar ausências." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const model = getTecnicoAusenciaModel();
    if (!model?.create) {
      return NextResponse.json({ error: "Modelo de ausências indisponível no servidor." }, { status: 500 });
    }

    const body = await req.json();

    const tecnicoKey = normalizeTeckey(body?.tecnicoKey || body?.tecnicoNome || body?.tecnico || "");
    const tipo = normalizeTipo(body?.tipo);
    const dataInicioRaw = parseDateInput(body?.dataInicio);
    const dataFimRaw = parseDateInput(body?.dataFim);
    const motivo = String(body?.motivo || "").trim();

    if (!tecnicoKey) {
      return NextResponse.json({ error: "Técnico inválido." }, { status: 400 });
    }
    if (!dataInicioRaw || !dataFimRaw) {
      return NextResponse.json({ error: "Datas inválidas." }, { status: 400 });
    }

    const dataInicio = startOfDay(dataInicioRaw);
    const dataFim = endOfDay(dataFimRaw);

    if (dataFim < dataInicio) {
      return NextResponse.json({ error: "A data fim não pode ser anterior à data início." }, { status: 400 });
    }

    const created = (await model.create({
      data: {
        tecnicoKey,
        tipo,
        dataInicio,
        dataFim,
        motivo: motivo || null,
      },
    })) as AusenciaRow;

    return NextResponse.json(
      {
        id: created.id,
        tecnicoKey: created.tecnicoKey,
        tecnicoNome: getTechnicianNameByKey(created.tecnicoKey) || created.tecnicoKey,
        tipo: created.tipo,
        dataInicio: created.dataInicio instanceof Date ? created.dataInicio.toISOString() : String(created.dataInicio || ""),
        dataFim: created.dataFim instanceof Date ? created.dataFim.toISOString() : String(created.dataFim || ""),
        motivo: created.motivo || null,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erro ao criar ausência/férias." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const model = getTecnicoAusenciaModel();
    if (!model?.findUnique || !model?.delete) {
      return NextResponse.json({ error: "Modelo de ausências indisponível no servidor." }, { status: 500 });
    }

    const id = Number(req.nextUrl.searchParams.get("id") || "");
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Registo não encontrado." }, { status: 404 });
    }

    await model.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "Erro ao remover ausência/férias." }, { status: 500 });
  }
}
