import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveMandatoryPackItemsForRaftAsync } from "@/lib/custom-pack-types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const diasParam = searchParams.get("dias") || "60";
    const dias = parseInt(diasParam, 10);
    if (isNaN(dias) || dias <= 0) {
      return NextResponse.json({ error: "Parâmetro 'dias' inválido." }, { status: 400 });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + dias);
    limitDate.setHours(23, 59, 59, 999);

    // Fetch all active rafts
    const rafts = await prisma.jangada.findMany({
      select: {
        id: true,
        serial: true,
        brand: true,
        model: true,
        capacity: true,
        packType: true,
        dataProxInspecao: true,
        shipNameManual: true,
        shipId: true,
        serviceStationId: true,
      },
    });

    // Filter rafts within next inspection period
    const upcomingRafts = rafts.filter((r) => {
      if (!r.dataProxInspecao) return false;
      const d = new Date(r.dataProxInspecao);
      return !isNaN(d.getTime()) && d >= now && d <= limitDate;
    });

    // Map to aggregate expected consumption quantities
    // Key: reference or lowercase name
    const consumptionMap = new Map<
      string,
      {
        referencia: string | null;
        name: string;
        quantidadeEstimada: number;
        raftsLinked: Array<{ id: number; serial: string; dataProxInspecao: string }>;
      }
    >();

    for (const raft of upcomingRafts) {
      const resolvedPack = await resolveMandatoryPackItemsForRaftAsync({
        brand: raft.brand,
        model: raft.model,
        packType: raft.packType,
        capacity: raft.capacity,
      });

      for (const item of resolvedPack.items) {
        // Use reference as main key if available, otherwise lowercase label
        const refKey = item.reference ? String(item.reference).trim().toUpperCase() : "";
        const nameKey = item.label.trim().toLowerCase();
        const mainKey = refKey || nameKey;

        const existing = consumptionMap.get(mainKey);
        if (existing) {
          existing.quantidadeEstimada += item.quantity;
          existing.raftsLinked.push({
            id: raft.id,
            serial: raft.serial,
            dataProxInspecao: raft.dataProxInspecao!,
          });
        } else {
          consumptionMap.set(mainKey, {
            referencia: item.reference || null,
            name: item.label,
            quantidadeEstimada: item.quantity,
            raftsLinked: [
              {
                id: raft.id,
                serial: raft.serial,
                dataProxInspecao: raft.dataProxInspecao!,
              },
            ],
          });
        }
      }
    }

    // Load all stock items to compare
    const stockItems = await prisma.stock.findMany({
      select: {
        id: true,
        referencia: true,
        descricao: true,
        quantidade: true,
        quantidadeMinima: true,
      },
    });

    type PrevisaoResult = {
      key: string;
      referencia: string | null;
      name: string;
      quantidadeEstimada: number;
      stockAtual: number;
      minStock: number;
      quantidadeEmFalta: number;
      raftsLinked: Array<{ id: number; serial: string; dataProxInspecao: string }>;
      stockId: number | null;
    };
    const results: PrevisaoResult[] = [];

    for (const [key, val] of consumptionMap.entries()) {
      // Find stock item by exact reference match or case-insensitive description match
      const matchedStock = stockItems.find((s) => {
        if (val.referencia && s.referencia) {
          return s.referencia.trim().toUpperCase() === val.referencia.trim().toUpperCase();
        }
        return s.descricao.trim().toLowerCase() === val.name.trim().toLowerCase();
      });

      const stockAtual = matchedStock ? matchedStock.quantidade : 0;
      const minStock = matchedStock ? matchedStock.quantidadeMinima || 0 : 0;
      const quantidadeEmFalta = Math.max(0, val.quantidadeEstimada - stockAtual);

      results.push({
        key,
        referencia: val.referencia,
        name: val.name,
        quantidadeEstimada: val.quantidadeEstimada,
        stockAtual,
        minStock,
        quantidadeEmFalta,
        raftsLinked: val.raftsLinked,
        stockId: matchedStock ? matchedStock.id : null,
      });
    }

    // Sort by items with greatest shortage first, then by estimated quantity
    results.sort((a, b) => b.quantidadeEmFalta - a.quantidadeEmFalta || b.quantidadeEstimada - a.quantidadeEstimada);

    return NextResponse.json({
      dias,
      totalJangadasAnalisadas: upcomingRafts.length,
      previsao: results,
    });
  } catch (error) {
    console.error("Error calculating stock forecasting:", error);
    return NextResponse.json({ error: "Erro interno ao calcular previsão de stock." }, { status: 500 });
  }
}
