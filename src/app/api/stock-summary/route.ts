import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API route that returns a stock summary.
 * It mirrors the logic of the standalone script but is callable from the UI.
 */
export async function GET() {
  try {
    // --- Calculate required quantities across all jangadas ---
    const required: Record<string, number> = {};
    const jangadas = await prisma.jangada.findMany({
      select: {
        valvulasAlivio: true,
        valvulasAtestar: true,
        cylinderSerial: true,
      },
    });
    for (const j of jangadas) {
      if (j.valvulasAlivio && j.valvulasAlivio.trim() !== '') {
        required['valvulasAlivio'] = (required['valvulasAlivio'] ?? 0) + 1;
      }
      if (j.valvulasAtestar && j.valvulasAtestar.trim() !== '') {
        required['valvulasAtestar'] = (required['valvulasAtestar'] ?? 0) + 1;
      }
      if (j.cylinderSerial && j.cylinderSerial.trim() !== '') {
        required['cylinder'] = (required['cylinder'] ?? 0) + 1;
      }
    }

    // --- Fetch current stock levels ---
    const stockMap: Record<string, number> = {};
    const stocks = await prisma.stock.findMany({
      select: { referencia: true, quantidade: true },
    });
    for (const s of stocks) {
      stockMap[s.referencia] = s.quantidade;
    }

    // --- Build response structure ---
    const report = {
      generatedAt: new Date().toISOString(),
      required,
      current: stockMap,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Stock summary API error:', error);
    return NextResponse.json({ error: 'Failed to generate stock summary' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
