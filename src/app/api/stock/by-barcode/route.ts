import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'code query parameter required' }, { status: 400 });
  }

  const stock = await prisma.stock.findUnique({
    where: { codigoBarras: code },
    select: {
      id: true,
      referencia: true,
      descricao: true,
      lote: true,
      validade: true,
      codigoBarras: true,
    },
  });

  if (!stock) {
    return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
  }

  return NextResponse.json(stock);
}
