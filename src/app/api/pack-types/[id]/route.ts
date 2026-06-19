import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import {
  deactivateCustomPackType,
  findCustomPackTypeById,
  upsertCustomPackType,
} from "@/lib/custom-pack-types";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function canViewPacks(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/packs") || canEditPath(access.permissions, "/packs");
}

function canEditPacks(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/packs");
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canViewPacks(access)) {
      return NextResponse.json({ error: "Sem permissão para ver packs personalizados." }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const pack = await findCustomPackTypeById(id);
    if (!pack) return NextResponse.json({ error: "Pack não encontrado." }, { status: 404 });
    return NextResponse.json(pack);
  } catch (error: any) {
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao obter pack personalizado.");
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEditPacks(access)) {
      return NextResponse.json({ error: "Sem permissão para editar packs personalizados." }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const body = await req.json();
    const pack = await upsertCustomPackType({
      id,
      data: body,
      userId: access.userId,
    });
    return NextResponse.json(pack);
  } catch (error: any) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao editar pack personalizado.");
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEditPacks(access)) {
      return NextResponse.json({ error: "Sem permissão para desativar packs personalizados." }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const pack = await deactivateCustomPackType(id, access.userId);
    return NextResponse.json(pack);
  } catch (error: any) {
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao desativar pack personalizado.");
  }
}