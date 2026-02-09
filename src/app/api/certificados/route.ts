import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/certificados - Retorna a quantidade de certificados importados
export async function GET() {
  try {
    const count = await prisma.certificado.count();
    return NextResponse.json({ total: count });
  } catch (error) {
    console.error('Erro ao contar certificados:', error);
    return NextResponse.json({ error: 'Erro ao contar certificados' }, { status: 500 });
  }
}
