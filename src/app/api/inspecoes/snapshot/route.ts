import { NextRequest, NextResponse } from "next/server";
import { getInspectionSnapshot } from "@/lib/inspection-snapshots";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const certificadoNumero = searchParams.get("certificadoNumero");
    
    if (!certificadoNumero) {
      return NextResponse.json({ error: "Parâmetro certificadoNumero é obrigatório." }, { status: 400 });
    }

    const snapshot = await getInspectionSnapshot(certificadoNumero);
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Error retrieving inspection snapshot:", error);
    return NextResponse.json({ error: "Erro interno ao obter snapshot." }, { status: 500 });
  }
}
