import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const certificados = await prisma.certificadoExtraido.findMany();
    return NextResponse.json(certificados);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar certificados' }, { status: 500 });
  }
}
