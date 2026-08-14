import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const fatoImersaoId = parseInt(id, 10);
    const history = await prisma.fatoImersaoComponentHistory.findMany({
      where: { fatoImersaoId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Erro ao listar histórico" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const fatoImersaoId = parseInt(id, 10);
    const body = await req.json();
    const changes = Array.isArray(body?.changes) ? body.changes : [];
    if (!changes.length) {
      return NextResponse.json({ error: "Sem alterações para registar." }, { status: 400 });
    }

    await prisma.fatoImersaoComponentHistory.createMany({
      data: changes.map((c: { fieldName?: unknown; oldValue?: unknown; newValue?: unknown; changedById?: unknown; changedByName?: unknown }) => ({
        fatoImersaoId,
        fieldName: String(c.fieldName || ""),
        oldValue: c.oldValue != null ? String(c.oldValue) : null,
        newValue: c.newValue != null ? String(c.newValue) : null,
        changedById: c.changedById != null ? Number(c.changedById) : null,
        changedByName: c.changedByName || null,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Erro ao registar histórico" }, { status: 500 });
  }
}
