import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serial = searchParams.get("serial");

    if (!serial) {
      return NextResponse.json({ error: "Serial é obrigatório" }, { status: 400 });
    }

    const movimentos = await prisma.movimentoEquipamento.findMany({
      where: { serial },
      orderBy: { data: "desc" }
    });

    return NextResponse.json(movimentos);
  } catch (error) {
    console.error("GET movimentos error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
