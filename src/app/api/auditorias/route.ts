import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 100)));
    const query = String(searchParams.get("q") || "").trim();

    const where = query
      ? {
          OR: [
            { tabela: { contains: query, mode: "insensitive" as const } },
            { tipoOperacao: { contains: query, mode: "insensitive" as const } },
            { descricao: { contains: query, mode: "insensitive" as const } },
            { usuario: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const rows = await prisma.auditoria.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao carregar auditorias", details: error }, { status: 500 });
  }
}
