import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function parseIdFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 2]; // /api/ordens-servico/[id]/inspecao-artigos
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const id = parseIdFromRequest(req);
    if (!id) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const ordem = await prisma.ordemServico.findUnique({
      where: { id },
      select: {
        inspecaoId: true,
        serviceStationId: true,
      },
    });

    if (!ordem) {
      return NextResponse.json({ error: "Ordem não encontrada." }, { status: 404 });
    }

    if (!ordem.inspecaoId) {
      return NextResponse.json({ artigos: [] });
    }

    const inspecao = await prisma.inspecao.findUnique({
      where: { id: ordem.inspecaoId },
      include: {
        artigos: {
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            name: true,
            quantidade: true,
            referencia: true,
            validade: true,
            codigoFabricante: true,
          },
        },
      },
    });

    if (!inspecao) {
      return NextResponse.json({ artigos: [] });
    }

    const artigos = inspecao.artigos.map((a) => ({
      id: a.id,
      name: a.name,
      quantidade: a.quantidade,
      referencia: a.referencia,
      validade: a.validade,
      codigoFabricante: a.codigoFabricante,
    }));

    return NextResponse.json({ artigos });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao carregar artigos da inspeção.");
  }
}
