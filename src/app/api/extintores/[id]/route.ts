import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canonicalizeDateFields } from "@/lib/date-display";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const item = await prisma.extintor.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Extintor não encontrado" }, { status: 404 });

    let navio: { id: number; nome: string; matricula: string | null } | null = null;
    if (item.shipId) {
      navio = await prisma.navio.findUnique({
        where: { id: item.shipId },
        select: { id: true, nome: true, matricula: true },
      });
    }

    return NextResponse.json({ ...item, navio });
  } catch (err) {
    console.error("[API /extintores/:id] GET:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro ao buscar extintor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = canonicalizeDateFields(await req.json(), [
      "dataFabrico",
      "dataUltimaRecarga",
      "dataProxRecarga",
      "dataTesteHidraulico",
      "dataProxTesteHidraulico",
    ]);
    const current = await prisma.extintor.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Extintor não encontrado" }, { status: 404 });

    const newShipId =
      body.shipId === null || body.shipId === "" || body.shipId === undefined
        ? null
        : Number(body.shipId);

    const capacidadeKg =
      body.capacidadeKg === null || body.capacidadeKg === "" || body.capacidadeKg === undefined
        ? null
        : Number(body.capacidadeKg);

    const updated = await prisma.extintor.update({
      where: { id },
      data: {
        serial: body.serial !== undefined ? body.serial : undefined,
        shipId: body.shipId !== undefined ? newShipId : undefined,
        marca: body.marca !== undefined ? body.marca : undefined,
        modelo: body.modelo !== undefined ? body.modelo : undefined,
        capacidadeKg: body.capacidadeKg !== undefined ? capacidadeKg : undefined,
        tipoAgente: body.tipoAgente !== undefined ? body.tipoAgente : undefined,
        estado: body.estado !== undefined ? body.estado : undefined,
        localizacao: body.localizacao !== undefined ? body.localizacao : undefined,
        dataFabrico: body.dataFabrico !== undefined ? body.dataFabrico : undefined,
        dataUltimaRecarga: body.dataUltimaRecarga !== undefined ? body.dataUltimaRecarga : undefined,
        dataProxRecarga: body.dataProxRecarga !== undefined ? body.dataProxRecarga : undefined,
        dataTesteHidraulico: body.dataTesteHidraulico !== undefined ? body.dataTesteHidraulico : undefined,
        dataProxTesteHidraulico: body.dataProxTesteHidraulico !== undefined ? body.dataProxTesteHidraulico : undefined,
        observacoes: body.observacoes !== undefined ? body.observacoes : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[API /extintores/:id] PUT:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro ao atualizar extintor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    await prisma.extintor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Erro ao eliminar" }, { status: 500 });
  }
}
