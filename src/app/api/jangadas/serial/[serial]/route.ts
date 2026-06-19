import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, context: { params: Promise<{ serial: string }> }) {
  try {
    const { serial } = await context.params;
    if (!serial) return NextResponse.json({ error: "Serial ausente" }, { status: 400 });
    const jangada = await prisma.jangada.findUnique({
      where: { serial },
      include: {
        certificadoAtivo: { include: { validities: true } },
        certificadosExtraidos: { include: { validities: true } },
      }
    });
    if (!jangada) return NextResponse.json({ error: "Jangada não encontrada" }, { status: 404 });
    return NextResponse.json(jangada);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao buscar jangada" }, { status: 500 });
  }
}
