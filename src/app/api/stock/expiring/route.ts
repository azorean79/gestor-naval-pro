import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export const runtime = "nodejs";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  
  // Try MM/YYYY format
  const matches = raw.match(/^(\d{2})[-/](\d{4})$/);
  if (matches) {
    const month = parseInt(matches[1], 10);
    const year = parseInt(matches[2], 10);
    // Set to the last day of that month
    return new Date(year, month, 0);
  }
  return null;
}

export async function GET() {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }

  try {
    const now = new Date();
    const limit90d = new Date();
    limit90d.setDate(now.getDate() + 90);

    // 1. Fetch active Stock items with validity
    const allStock = await prisma.stock.findMany({
      where: {
        estadoArtigo: "ATIVO",
        validade: { not: null },
        quantidade: { gt: 0 },
      },
      select: {
        id: true,
        referencia: true,
        descricao: true,
        validade: true,
        quantidade: true,
        lote: true,
        categoria: true,
      },
    });

    // 2. Fetch active ArtigoJangada with validity
    const allArtigoJangada = await prisma.artigoJangada.findMany({
      where: {
        validade: { not: null },
      },
      select: {
        id: true,
        name: true,
        quantidade: true,
        validade: true,
        referencia: true,
        Jangada: {
          select: {
            serial: true,
            owner: true,
          },
        },
      },
    });

    type ExpiringItem = {
      id: number;
      type: "stock" | "jangada";
      referencia: string;
      descricao: string;
      lote?: string;
      quantidade: number;
      validade: string;
      daysRemaining: number;
      owner?: string;
      serial?: string;
    };

    const expired: ExpiringItem[] = [];
    const expiring30d: ExpiringItem[] = [];
    const expiring60d: ExpiringItem[] = [];
    const expiring90d: ExpiringItem[] = [];

    const nowTime = now.getTime();

    // Process Stock
    for (const item of allStock) {
      const vDate = parseDate(item.validade);
      if (!vDate) continue;

      const diffTime = vDate.getTime() - nowTime;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (days > 90) continue;

      const record: ExpiringItem = {
        id: item.id,
        type: "stock",
        referencia: item.referencia,
        descricao: item.descricao,
        lote: item.lote || undefined,
        quantidade: item.quantidade,
        validade: vDate.toISOString().slice(0, 10),
        daysRemaining: days,
      };

      if (days < 0) expired.push(record);
      else if (days <= 30) expiring30d.push(record);
      else if (days <= 60) expiring60d.push(record);
      else expiring90d.push(record);
    }

    // Process ArtigoJangada
    for (const item of allArtigoJangada) {
      if (!item.validade) continue;

      const diffTime = item.validade.getTime() - nowTime;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (days > 90) continue;

      const record: ExpiringItem = {
        id: item.id,
        type: "jangada",
        referencia: item.referencia || "SEM-REF",
        descricao: item.name,
        quantidade: item.quantidade,
        validade: item.validade.toISOString().slice(0, 10),
        daysRemaining: days,
        owner: item.Jangada?.owner || "Desconhecido",
        serial: item.Jangada?.serial || undefined,
      };

      if (days < 0) expired.push(record);
      else if (days <= 30) expiring30d.push(record);
      else if (days <= 60) expiring60d.push(record);
      else expiring90d.push(record);
    }

    // Sort by urgency (fewer days first)
    const sortByDays = (a: ExpiringItem, b: ExpiringItem) => a.daysRemaining - b.daysRemaining;
    expired.sort(sortByDays);
    expiring30d.sort(sortByDays);
    expiring60d.sort(sortByDays);
    expiring90d.sort(sortByDays);

    return NextResponse.json({
      summary: {
        expiredCount: expired.length,
        expiring30dCount: expiring30d.length,
        expiring60dCount: expiring60d.length,
        expiring90dCount: expiring90d.length,
        totalAlerts: expired.length + expiring30d.length + expiring60d.length + expiring90d.length,
      },
      expired,
      expiring30d,
      expiring60d,
      expiring90d,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao consultar validades de stock." }, { status: 500 });
  }
}
