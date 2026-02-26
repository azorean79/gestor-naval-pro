import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const obras = await prisma.ordemServico.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ data: obras });
}
