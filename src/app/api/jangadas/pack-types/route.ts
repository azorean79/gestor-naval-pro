import { NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { listAvailablePackTypeOptions } from "@/lib/custom-pack-types";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const options = await listAvailablePackTypeOptions();
    return NextResponse.json({ options });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao listar tipos de pack.";
    return buildDatabaseErrorResponse(error, message);
  }
}