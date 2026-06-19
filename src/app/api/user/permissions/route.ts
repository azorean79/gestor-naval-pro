import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { logAuditoria } from "@/lib/auditoria";
import { hasElevatedAccess } from "@/lib/permission-access";
import {
  defaultPermissionsForRole,
  resolveEffectivePermissions,
  setUserPermissionOverride,
} from "@/lib/user-permissions";
import {
  EDITABLE_FIELD_GROUPS,
  PAGE_PREFIX_OPTIONS,
  PERMISSION_MODULE_OPTIONS,
} from "@/lib/permissions-catalog";

async function requireAdminSession() {
  const session = await getAuthSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 }) };
  }

  if (!hasElevatedAccess({ role: session.user.role, permissions: session.user.permissions })) {
    return { error: NextResponse.json({ error: "Apenas administradores podem gerir permissões." }, { status: 403 }) };
  }

  return { session };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "userId inválido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  const permissions = await resolveEffectivePermissions({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  });

  return NextResponse.json({
    userId: user.id,
    role: user.role,
    permissions,
    defaults: defaultPermissionsForRole(user.role === "ADMIN" ? "ADMIN" : "USER"),
    catalog: {
      modules: PERMISSION_MODULE_OPTIONS,
      pages: PAGE_PREFIX_OPTIONS,
      editableFields: EDITABLE_FIELD_GROUPS,
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const userId = Number((body as any).userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "userId inválido." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  const before = await resolveEffectivePermissions({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  });

  await setUserPermissionOverride(user.id, (body as any).permissions || {});

  const effective = await resolveEffectivePermissions({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  });

  await logAuditoria({
    tabela: "UserPermissions",
    tipoOperacao: "UPDATE",
    idRegisto: user.id,
    descricao: `Atualização de privilégios do utilizador ${user.id}`,
    usuario: auth.session?.user?.email || "sistema",
    dadosAntes: before,
    dadosDepois: effective,
  });

  return NextResponse.json({
    success: true,
    userId: user.id,
    permissions: effective,
  });
}
