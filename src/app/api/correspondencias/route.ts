import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
config();

import { prisma } from '@/lib/prisma';

// GET /api/correspondencias - Listar todas as correspondências
export async function GET() {
  try {
    const correspondencias = await prisma.correspondencia.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(correspondencias);
  } catch (error) {
    console.error('Erro ao buscar correspondências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/correspondencias - Criar nova correspondência
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const correspondencia = await prisma.correspondencia.create({
      data: {
        tipo: body.tipo,
        assunto: body.assunto,
        descricao: body.descricao,
        prioridade: body.prioridade || 'normal',
        status: body.status || 'rascunho',
        remetenteNome: body.remetenteNome,
        remetenteEmail: body.remetenteEmail,
        remetenteTelefone: body.remetenteTelefone,
        destinatarioNome: body.destinatarioNome,
        destinatarioEmail: body.destinatarioEmail,
        destinatarioTelefone: body.destinatarioTelefone,
        enderecoEntrega: body.enderecoEntrega,
        conteudo: body.conteudo,
        metodoEnvio: body.metodoEnvio,
        responsavel: body.responsavel || 'Julio Correia'
      }
    });

    return NextResponse.json(correspondencia, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar correspondência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}