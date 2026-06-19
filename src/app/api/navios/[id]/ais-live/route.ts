import { NextResponse } from "next/server";
import { getNavioAisLiveResult } from "@/lib/aisstream";

export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const result = await getNavioAisLiveResult(id);
    return NextResponse.json(result.body, { 
      status: result.status,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro inesperado ao consultar o AISStream.",
        ok: false,
        fetchedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
