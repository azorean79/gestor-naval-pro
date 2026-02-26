import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    const action = searchParams.get('action');

    // Simples autenticação por API key (em produção, usar JWT ou OAuth)
    if (!apiKey || apiKey !== process.env.PARTNER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'getJangadas') {
      const jangadas = await prisma.jangada.findMany();

      return NextResponse.json({ jangadas });
    }

    if (action === 'getNavios') {
      const navios = await prisma.navio.findMany();

      return NextResponse.json({ navios });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Partners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    if (!apiKey || apiKey !== process.env.PARTNER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Exemplo: sincronizar dados de parceiro
    if (action === 'syncInspecao') {
      // Lógica para salvar inspeção de parceiro
      // Por exemplo, adicionar à coleção inspections
      return NextResponse.json({ success: true, message: 'Inspeção sincronizada' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Partners POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}