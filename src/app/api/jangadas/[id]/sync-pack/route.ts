import { NextRequest, NextResponse } from "next/server";
import { syncRaftArticlesWithPackType } from "@/lib/checklist-sync";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const result = await syncRaftArticlesWithPackType(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao sincronizar artigos da jangada:", error);
    return NextResponse.json(
      { error: "Erro interno ao sincronizar artigos" },
      { status: 500 }
    );
  }
}
