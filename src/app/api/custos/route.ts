import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const custos = await prisma.custo.findMany({
      orderBy: { data: "desc" },
    });
    return NextResponse.json(custos);
  } catch (error) {
    console.error("Erro ao buscar custos:", error);
    return NextResponse.json({ error: "Erro ao buscar custos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const custo = await prisma.custo.create({
      data: {
        tipo: body.tipo,
        descricao: body.descricao,
        valor: Number(body.valor),
        data: body.data,
        entidade: body.entidade,
      },
    });
    return NextResponse.json(custo);
  } catch (error) {
    console.error("Erro ao criar custo:", error);
    return NextResponse.json({ error: "Erro ao criar custo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }
    await prisma.custo.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao eliminar custo:", error);
    return NextResponse.json({ error: "Erro ao eliminar custo" }, { status: 500 });
  }
}
