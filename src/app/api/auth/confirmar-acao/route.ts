import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import bcrypt from "bcryptjs";

// Ações que requerem confirmação reforçada
const SENSITIVE_ACTIONS = [
  "aprovar_orcamento",
  "faturar",
  "emitir_recibo",
  "alterar_precos",
  "eliminar_registo",
  "alterar_pagamento",
  "emitir_nota_credito",
] as const;

type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, password } = body;

    if (!SENSITIVE_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Ação não reconhecida como sensível." }, { status: 400 });
    }

    if (!password || String(password).trim().length === 0) {
      return NextResponse.json({ error: "Indique a sua palavra-passe para confirmar." }, { status: 400 });
    }

    // Obter o utilizador atual da sessão
    const user = await prisma.user.findUnique({
      where: { id: access.userId },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Esta conta não tem palavra-passe definida (login Google). Use OTP SMS ou contacte o administrador." },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Palavra-passe incorreta. Ação não autorizada." }, { status: 403 });
    }

    await prisma.auditoria.create({
      data: {
        tabela: "ConfirmacaoSensivel",
        tipoOperacao: "AUTHORIZE",
        idRegisto: Number(user.id),
        descricao: `Ação sensível autorizada: ${action}`,
        usuario: user.name || user.email,
      },
    });

    return NextResponse.json({
      success: true,
      authorized: true,
      user: { id: user.id, name: user.name, email: user.email },
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/auth/confirmar-acao]", error);
    return NextResponse.json({ error: "Erro ao confirmar ação sensível." }, { status: 500 });
  }
}
