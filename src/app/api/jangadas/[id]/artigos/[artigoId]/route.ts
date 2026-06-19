import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
const artigoJangadaDelegate = (prisma as any).artigoJangada;

function ensureArtigoJangadaDelegate() {
  if (!artigoJangadaDelegate) {
    return NextResponse.json(
      { error: "Modelo ArtigoJangada indisponível no Prisma Client atual" },
      { status: 500 }
    );
  }
  return null;
}

// PUT /api/jangadas/[id]/artigos/[artigoId] - Atualiza artigo
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; artigoId: string }> }
) {
  const delegateError = ensureArtigoJangadaDelegate();
  if (delegateError) return delegateError;

  const { id, artigoId: rawArtigoId } = await context.params;
  const jangadaId = Number(id);
  const artigoId = Number(rawArtigoId);

  if (isNaN(jangadaId) || isNaN(artigoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const data = await req.json();
  const existing = await artigoJangadaDelegate.findUnique({ where: { id: artigoId } });

  if (!existing || existing.jangadaId !== jangadaId) {
    return NextResponse.json({ error: "Artigo não encontrado para esta jangada" }, { status: 404 });
  }

  const artigo = await artigoJangadaDelegate.update({
    where: { id: artigoId },
    data,
  });

  return NextResponse.json(artigo);
}

// DELETE /api/jangadas/[id]/artigos/[artigoId] - Remove artigo
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; artigoId: string }> }
) {
  const delegateError = ensureArtigoJangadaDelegate();
  if (delegateError) return delegateError;

  const { id, artigoId: rawArtigoId } = await context.params;
  const jangadaId = Number(id);
  const artigoId = Number(rawArtigoId);

  if (isNaN(jangadaId) || isNaN(artigoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const existing = await artigoJangadaDelegate.findUnique({ where: { id: artigoId } });

  if (!existing || existing.jangadaId !== jangadaId) {
    return NextResponse.json({ error: "Artigo não encontrado para esta jangada" }, { status: 404 });
  }

  await artigoJangadaDelegate.delete({ where: { id: artigoId } });
  return NextResponse.json({ success: true });
}
