import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/stock/critical?stationId=1
 * Returns stock items whose quantity is at or below the minimum threshold.
 * Also includes items with zero quantity regardless of minimum.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const stationId = Number(searchParams.get("stationId"));

    const allActive = await prisma.stock.findMany({
      where: {
        estadoArtigo: "ATIVO",
        ...(stationId ? { serviceStationId: stationId } : {}),
      },
      select: {
        id: true,
        referencia: true,
        descricao: true,
        quantidade: true,
        quantidadeMinima: true,
        categoria: true,
        serviceStationId: true,
        precoCompra: true,
        associavelJangada: true,
      },
      orderBy: [{ quantidade: "asc" }, { descricao: "asc" }],
    });

    const criticalItems = allActive.filter((item) => {
      if (item.quantidade === 0) return true;
      const min = item.quantidadeMinima || 0;
      return min > 0 && item.quantidade <= min;
    });

    return NextResponse.json({
      criticalItems: criticalItems.map((item) => ({
        ...item,
        deficit: Math.max(0, (item.quantidadeMinima || 0) - item.quantidade),
      })),
    });
  } catch (error) {
    console.error("[stock/critical]", error);
    return NextResponse.json({ error: "Erro ao carregar stock crítico." }, { status: 500 });
  }
}
