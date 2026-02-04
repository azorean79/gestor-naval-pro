import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
config();

import { prisma } from '@/lib/prisma';

// GET /api/certificados/envios - Listar envios de certificados
export async function GET() {
  try {
    const envios = await prisma.envio.findMany({
      where: {
        tipo: 'certificado'
      },
      include: {
        itens: {
          include: {
            certificado: true
          }
        },
        cliente: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(envios);
  } catch (error) {
    console.error('Erro ao buscar envios de certificados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/certificados/envios - Criar envio de certificados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const envio = await prisma.envio.create({
      data: {
        tipo: 'certificado',
        status: body.status || 'preparando',
        clienteId: body.clienteId,
        destinatarioNome: body.destinatarioNome || 'Cliente',
        enderecoEntrega: body.enderecoEntrega,
        metodoEnvio: body.metodoEnvio,
        responsavel: body.responsavel || 'Julio Correia',
        observacoes: body.observacoes,
        itens: {
          create: body.certificados.map((cert: any) => ({
            tipo: 'certificado',
            certificadoId: cert.id,
            quantidade: 1,
            observacoes: cert.observacoes
          }))
        }
      },
      include: {
        itens: {
          include: {
            certificado: true
          }
        },
        cliente: true
      }
    });

    return NextResponse.json(envio, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar envio de certificados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}