import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import {
  listCustomPackTypes,
  listAvailablePackTypeOptions,
  upsertCustomPackType,
} from "@/lib/custom-pack-types";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function canViewPacks(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/packs") || canEditPath(access.permissions, "/packs");
}

function canEditPacks(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canEditPath(access.permissions, "/packs");
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const optionsOnly = searchParams.get("optionsOnly") === "true";

    if (optionsOnly) {
      const options = await listAvailablePackTypeOptions();
      return NextResponse.json({ options });
    }

    if (!canViewPacks(access)) {
      return NextResponse.json({ error: "Sem permissão para ver packs personalizados." }, { status: 403 });
    }

    const includeInactive = searchParams.get("includeInactive") === "true";
    const packs = await listCustomPackTypes({ includeInactive });
    const warning = packs.length === 0
      ? "A lista de packs personalizados está vazia ou o armazenamento ainda não está disponível neste servidor."
      : null;
    return NextResponse.json({ packs, warning });
  } catch (error: any) {
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao listar packs personalizados.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!canEditPacks(access)) {
      return NextResponse.json({ error: "Sem permissão para criar packs personalizados." }, { status: 403 });
    }

    const body = await req.json();
    const pack = await upsertCustomPackType({
      data: body,
      userId: access.userId,
    });
    return NextResponse.json(pack, { status: 201 });
  } catch (error: any) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao criar pack personalizado.");
  }
}