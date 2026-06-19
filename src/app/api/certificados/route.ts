import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const certificados = await prisma.certificadoExtraido.findMany();
    return NextResponse.json(certificados);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar certificados', details: error }, { status: 500 });
  }
}
