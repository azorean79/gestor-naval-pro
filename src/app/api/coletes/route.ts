import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeIds(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: any = {};
    if (searchParams.get("serial")) where.serial = { contains: searchParams.get("serial"), mode: "insensitive" };
    if (searchParams.get("marca")) where.marca = { contains: searchParams.get("marca"), mode: "insensitive" };
    if (searchParams.get("modelo")) where.modelo = { contains: searchParams.get("modelo"), mode: "insensitive" };
    if (searchParams.get("tamanho")) where.tamanho = { contains: searchParams.get("tamanho"), mode: "insensitive" };
    if (searchParams.get("estado")) where.estado = { contains: searchParams.get("estado"), mode: "insensitive" };
    if (searchParams.get("dataFabrico")) where.dataFabrico = { contains: searchParams.get("dataFabrico"), mode: "insensitive" };
    if (searchParams.get("shipId")) where.shipId = Number(searchParams.get("shipId"));

    const coletes = await prisma.colete.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        shipId: true,
        serial: true,
        marca: true,
        modelo: true,
        tamanho: true,
        estado: true,
        dataFabrico: true,
        dataInspecao: true,
        dataProxInspecao: true,
        observacoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(coletes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao listar coletes" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const normalizedIds = normalizeIds(ids);
    if (normalizedIds.length === 0) {
      return NextResponse.json({ error: "Envie um array de IDs para exclusão em lote." }, { status: 400 });
    }

    await prisma.colete.deleteMany({
      where: {
        id: {
          in: normalizedIds,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao eliminar coletes" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = normalizeIds(body?.ids);
    const action = String(body?.action || "").trim();

    if (ids.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos um colete." }, { status: 400 });
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

    const result = await prisma.colete.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao aplicar ação em lote nos coletes" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const colete = await prisma.colete.create({
      data: {
        shipId: data.shipId || null,
        serial: data.serial,
        marca: data.marca,
        modelo: data.modelo,
        tamanho: data.tamanho,
        estado: data.estado,
        dataFabrico: data.dataFabrico,
        dataInspecao: data.dataInspecao,
        dataProxInspecao: data.dataProxInspecao,
        observacoes: data.observacoes,
      },
      select: {
        id: true,
        shipId: true,
        serial: true,
        marca: true,
        modelo: true,
        tamanho: true,
        estado: true,
        dataFabrico: true,
        dataInspecao: true,
        dataProxInspecao: true,
        observacoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(colete, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao criar colete" }, { status: 400 });
  }
}
