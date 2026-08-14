import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referencia, descricao, quantidade, marcaJangada, modeloJangada } = body;

    if (!referencia) {
      return NextResponse.json({ error: "Referência é obrigatória" }, { status: 400 });
    }

    const existing = await prisma.stock.findFirst({
      where: { referencia },
    });

    if (existing) {
      return NextResponse.json({ error: "Já existe stock com esta referência", stock: existing }, { status: 409 });
    }

    const stock = await prisma.stock.create({
      data: {
        referencia,
        descricao: descricao || `Artigo pack: ${referencia}`,
        quantidade: typeof quantidade === "number" ? quantidade : 0,
        precoVenda: 0,
        associavelJangada: true,
        aplicavelMarcaJangada: marcaJangada || null,
        aplicavelModeloJangada: modeloJangada || null,
        categoria: "CONSUMIVEIS",
        localizacao: "Oficina",
      },
    });

    return NextResponse.json({ success: true, stock }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao criar item de stock:", msg);
    return NextResponse.json({ error: "Erro ao criar item de stock", details: msg }, { status: 500 });
  }
}
