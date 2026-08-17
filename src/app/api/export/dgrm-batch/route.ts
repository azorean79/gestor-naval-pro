import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs de jangadas em falta." }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: "Máximo de 100 jangadas por lote." }, { status: 400 });
    }

    const jangadas = await prisma.jangada.findMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      message: `Lote DGRM gerado para ${jangadas.length} jangada(s).`,
      count: jangadas.length,
      jangadas: jangadas.map(j => ({ id: j.id, serial: j.serial, brand: j.brand, model: j.model })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar lote DGRM.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
