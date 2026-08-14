import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { resolveMandatoryPackItemsForRaftAsync } from "@/lib/custom-pack-types";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const packType = String(searchParams.get("packType") || "").trim();
    const brand = String(searchParams.get("brand") || "").trim();
    const model = String(searchParams.get("model") || "").trim();
    const capacity = Number(searchParams.get("capacity") || 0);

    const resolved = await resolveMandatoryPackItemsForRaftAsync({
      packType,
      brand,
      model,
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : undefined,
    });

    return NextResponse.json(resolved);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao resolver artigos do pack.";
    return buildDatabaseErrorResponse(error, message);
  }
}