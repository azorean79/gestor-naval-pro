import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type SnapshotItem = Record<string, unknown>;

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const raft = await prisma.jangada.findUnique({
      where: { id },
      select: { syncSnapshot: true },
    });

    if (!raft) {
      return NextResponse.json({ error: "Jangada não encontrada" }, { status: 404 });
    }

    if (!raft.syncSnapshot) {
      return NextResponse.json({ error: "Não existe snapshot para reverter" }, { status: 400 });
    }

    let snapshot: SnapshotItem[];
    try {
      snapshot = JSON.parse(raft.syncSnapshot) as SnapshotItem[];
    } catch {
      return NextResponse.json({ error: "Snapshot corrompido" }, { status: 500 });
    }

    // Apagar artigos atuais e recriar a partir do snapshot
    await prisma.artigoJangada.deleteMany({ where: { jangadaId: id } });

    for (const artigo of snapshot) {
      const data = { ...artigo };
      delete data.id;
      delete data.jangadaId;
      await prisma.artigoJangada.create({
        data: { ...data, jangadaId: id } as unknown as Prisma.ArtigoJangadaCreateInput,
      });
    }

    // Limpar snapshot
    await prisma.jangada.update({
      where: { id },
      data: { syncSnapshot: null },
    });

    return NextResponse.json({ success: true, restored: snapshot.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao reverter sync:", msg);
    return NextResponse.json(
      { error: "Erro ao reverter sincronização", details: msg },
      { status: 500 }
    );
  }
}
