import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET() {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const waterExpiring = await prisma.artigoJangada.findMany({
      where: { name: { contains: "Água" }, validade: { lte: thirtyDays, gte: now } },
      select: { id: true, name: true, quantidade: true, validade: true, jangadaId: true, Jangada: { select: { serial: true, brand: true, model: true } } },
      orderBy: { validade: "asc" },
    });

    const rationsExpiring = await prisma.artigoJangada.findMany({
      where: { name: { contains: "Rações" }, validade: { lte: thirtyDays, gte: now } },
      select: { id: true, name: true, quantidade: true, validade: true, jangadaId: true, Jangada: { select: { serial: true, brand: true, model: true } } },
      orderBy: { validade: "asc" },
    });

    const nowIso = now.toISOString().slice(0, 10);
    const thirtyDaysIso = thirtyDays.toISOString().slice(0, 10);

    const coletesExpiring = await prisma.colete.findMany({
      where: { dataProxInspecao: { lte: thirtyDaysIso, gte: nowIso } },
      select: { id: true, serial: true, marca: true, modelo: true, dataProxInspecao: true, shipId: true },
      orderBy: { dataProxInspecao: "asc" },
    });

    const stockExpiring = await prisma.stock.findMany({
      where: { validade: { lte: thirtyDaysIso, gte: nowIso }, estadoArtigo: "ATIVO" },
      select: { id: true, descricao: true, quantidade: true, validade: true, referencia: true },
      orderBy: { validade: "asc" },
    });

    return NextResponse.json({
      geradoEm: now.toISOString(),
      agua: waterExpiring,
      racoes: rationsExpiring,
      coletes: coletesExpiring,
      stock: stockExpiring,
      totais: {
        agua: waterExpiring.length,
        racoes: rationsExpiring.length,
        coletes: coletesExpiring.length,
        stock: stockExpiring.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar o relatório de validades.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
