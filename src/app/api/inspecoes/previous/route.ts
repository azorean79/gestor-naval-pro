import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jangadaId = searchParams.get("jangadaId");
    const beforeDate = searchParams.get("beforeDate");

    if (!jangadaId || !beforeDate) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: jangadaId, beforeDate" }, { status: 400 });
    }

    const prevInspecao = await prisma.inspecao.findFirst({
      where: {
        jangadaId: parseInt(jangadaId),
        dataInspecao: { lt: beforeDate },
      },
      orderBy: { dataInspecao: 'desc' },
      select: { certificadoNumero: true, dataInspecao: true },
    });

    return NextResponse.json({ 
      prevCertificadoNumero: prevInspecao?.certificadoNumero || null,
      prevDataInspecao: prevInspecao?.dataInspecao || null,
    });
  } catch (error) {
    console.error("Error fetching previous inspection:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}