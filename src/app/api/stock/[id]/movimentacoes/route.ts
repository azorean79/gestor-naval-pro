import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";

function parseIdParam(value: unknown): number {
  const id = Number(value);
  return Number.isFinite(id) ? id : NaN;
}

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

// GET /api/stock/[id]/movimentacoes - Buscar histórico de movimentações
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: 'Sessão obrigatória.' }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return NextResponse.json({ error: 'Sem permissão para consultar stock.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = parseIdParam(rawId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const movimentacoes = await prisma.movimentacaoStock.findMany({
      where: { stockId: id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Últimas 100 movimentações
    });

    return NextResponse.json(movimentacoes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar movimentações', details: error }, { status: 500 });
  }
}
