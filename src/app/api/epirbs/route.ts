import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function getEpirbDelegate() {
  const delegate = (prisma as any).epirb;
  if (!delegate) {
    throw new Error("Prisma client ainda não está sincronizado com o modelo EPIRB.");
  }
  return delegate;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};

  if (searchParams.get("serial")) where.serial = { contains: searchParams.get("serial"), mode: "insensitive" };
  if (searchParams.get("marca")) where.marca = { contains: searchParams.get("marca"), mode: "insensitive" };
  if (searchParams.get("modelo")) where.modelo = { contains: searchParams.get("modelo"), mode: "insensitive" };
  if (searchParams.get("tipo")) where.tipo = { contains: searchParams.get("tipo"), mode: "insensitive" };
  if (searchParams.get("hexId")) where.hexId = { contains: searchParams.get("hexId"), mode: "insensitive" };
  if (searchParams.get("estado")) where.estado = { contains: searchParams.get("estado"), mode: "insensitive" };
  if (searchParams.get("shipId")) where.shipId = Number(searchParams.get("shipId"));

  const epirbs = await getEpirbDelegate().findMany({ where, orderBy: [{ serial: "asc" }] });
  return NextResponse.json(epirbs);
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const normalizedIds = normalizeIds(ids);
    if (normalizedIds.length === 0) {
      return NextResponse.json({ error: "Envie um array de IDs para exclusão em lote." }, { status: 400 });
    }

    await getEpirbDelegate().deleteMany({
      where: {
        id: {
          in: normalizedIds,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao eliminar EPIRBs" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = normalizeIds(body?.ids);
    const action = String(body?.action || "").trim();

    if (ids.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos um EPIRB." }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Ação em lote não indicada." }, { status: 400 });
    }

    let data: Record<string, unknown>;

    if (action === "assign-ship") {
      const shipId = Number(body?.shipId);
      if (!Number.isFinite(shipId) || shipId <= 0) {
        return NextResponse.json({ error: "Navio inválido para associação em lote." }, { status: 400 });
      }
      data = { shipId };
    } else if (action === "clear-ship") {
      data = { shipId: null };
    } else if (action === "set-status") {
      const estado = String(body?.estado || "").trim();
      if (!estado) {
        return NextResponse.json({ error: "Estado inválido para atualização em lote." }, { status: 400 });
      }
      data = { estado };
    } else {
      return NextResponse.json({ error: "Ação em lote não suportada." }, { status: 400 });
    }

    const result = await getEpirbDelegate().updateMany({
      where: { id: { in: ids } },
      data,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao aplicar ação em lote nos EPIRBs" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!String(data?.serial || "").trim()) {
      return NextResponse.json({ error: "Nº de série do EPIRB é obrigatório." }, { status: 400 });
    }

    const epirb = await getEpirbDelegate().create({
      data: {
        shipId: data.shipId || null,
        serial: String(data.serial).trim(),
        marca: data.marca || null,
        modelo: data.modelo || null,
        tipo: data.tipo || null,
        hexId: data.hexId || null,
        estado: data.estado || "Ativo",
        dataInspecao: data.dataInspecao || null,
        dataProxInspecao: data.dataProxInspecao || null,
        dataValidadeBateria: data.dataValidadeBateria || null,
        ownerName: data.ownerName || null,
        ownerAddress: data.ownerAddress || null,
        ownerPhone: data.ownerPhone || null,
        emergencyContact1Name: data.emergencyContact1Name || null,
        emergencyContact1Phone: data.emergencyContact1Phone || null,
        emergencyContact2Name: data.emergencyContact2Name || null,
        emergencyContact2Phone: data.emergencyContact2Phone || null,
        observacoes: data.observacoes || null,
      },
    });

    return NextResponse.json(epirb, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar EPIRB" }, { status: 400 });
  }
}
