import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { stampInspectionWithDigest, verifyInspectionIntegrity } from "@/lib/integrity-stamp";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id: rawId } = await context.params;
    const inspecaoId = Number(rawId);
    if (!inspecaoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const result = await verifyInspectionIntegrity(inspecaoId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return buildDatabaseErrorResponse(err, err instanceof Error ? err.message : "Erro ao verificar integridade");
  }
}

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id: rawId } = await context.params;
    const inspecaoId = Number(rawId);
    if (!inspecaoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const stamped = await stampInspectionWithDigest(inspecaoId);
    if (!stamped) return NextResponse.json({ error: "Inspeção não encontrada" }, { status: 404 });

    return NextResponse.json({ success: true, ...stamped });
  } catch (err: unknown) {
    return buildDatabaseErrorResponse(err, err instanceof Error ? err.message : "Erro ao aplicar carimbo temporal");
  }
}
