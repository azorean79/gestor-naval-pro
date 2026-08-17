import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const navio = await prisma.navio.findUnique({
      where: { id },
      include: {
        cliente: true
      }
    });

    if (!navio) return NextResponse.json({ error: "Navio não encontrado" }, { status: 404 });

    const jangadas = await prisma.jangada.findMany({
      where: { shipId: id },
      orderBy: { dataProxInspecao: "asc" }
    });

    const coletes = await prisma.colete.findMany({
      where: { shipId: id },
      orderBy: { dataProxInspecao: "asc" }
    });

    const epirbs = await prisma.epirb.findMany({
      where: { shipId: id },
      orderBy: { dataProxInspecao: "asc" }
    });

    const extintores = await prisma.extintor.findMany({
      where: { shipId: id },
      orderBy: { dataProxRecarga: "asc" }
    });

    return NextResponse.json({
      ...navio,
      jangadas,
      coletes,
      epirbs,
      extintores
    });
  } catch (error) {
    console.error("Erro a carregar dossier de navio:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
