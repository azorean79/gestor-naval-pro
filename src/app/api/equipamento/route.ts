import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: Prisma.EquipamentoFindManyArgs["where"] = {};
    if (searchParams.get("nome")) where.nome = { contains: searchParams.get("nome")!, mode: "insensitive" };
    if (searchParams.get("tipo")) where.tipo = { contains: searchParams.get("tipo")!, mode: "insensitive" };
    if (searchParams.get("marca")) where.marca = { contains: searchParams.get("marca")!, mode: "insensitive" };
    if (searchParams.get("modelo")) where.modelo = { contains: searchParams.get("modelo")!, mode: "insensitive" };
    if (searchParams.get("serial")) where.serial = { contains: searchParams.get("serial")!, mode: "insensitive" };
    if (searchParams.get("estado")) where.estado = { contains: searchParams.get("estado")!, mode: "insensitive" };

    const equipamentos = await prisma.equipamento.findMany({ where });
    return NextResponse.json(equipamentos);
  } catch (error) {
    console.error("GET equipamento error:", error);
    return NextResponse.json({ error: "Erro ao buscar equipamentos." }, { status: 500 });
  }
}
