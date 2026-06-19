import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jangadaId = searchParams.get('jangadaId');
    const referenciaAtual = searchParams.get('referencia');

    if (!jangadaId) {
      return NextResponse.json(
        { error: 'jangadaId é obrigatório' },
        { status: 400 }
      );
    }

    // Obter jangada e seus artigos
    const jangada = await prisma.jangada.findUnique({
      where: { id: parseInt(jangadaId) },
      include: { artigos: true },
    });

    if (!jangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      );
    }

    // Obter artigo atual
    const artigoAtual = jangada.artigos.find(
      (a) => a.referencia === referenciaAtual
    );

    // Obter stock disponível para substituição
    const stockDisponivel = await prisma.stock.findMany({
      where: {
        // Procurar por categoria similar ou nome similar
        OR: [
          {
            descricao: {
              contains: artigoAtual?.name.split(' ')[0] || '',
              mode: 'insensitive',
            },
          },
          {
            categoria: artigoAtual?.name.includes('Facho')
              ? 'Emergência'
              : undefined,
          },
        ],
      },
      orderBy: { descricao: 'asc' },
    });

    return NextResponse.json({
      jangada,
      artigoAtual,
      stockDisponivel,
    });
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar artigos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jangadaId, referenciaAtual, novaReferencia, quantidade } = body;

    if (!jangadaId || !referenciaAtual || !novaReferencia) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Esconder a transação Prisma
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obter artigo atual
      const artigoAtual = await tx.artigoJangada.findFirst({
        where: {
          jangadaId: parseInt(jangadaId),
          referencia: referenciaAtual,
        },
      });

      if (!artigoAtual) {
        throw new Error('Artigo atual não encontrado');
      }

      // 2. Obter informações do novo stock
      const novoStock = await tx.stock.findUnique({
        where: { referencia: novaReferencia },
      });

      if (!novoStock) {
        throw new Error('Novo artigo do stock não encontrado');
      }

      // 3. Atualizar artigo na jangada
      const artigoAtualizado = await tx.artigoJangada.update({
        where: { id: artigoAtual.id },
        data: {
          referencia: novaReferencia,
          name: novoStock.descricao,
          quantidade: quantidade || artigoAtual.quantidade,
          codigoFabricante: novoStock.codigoFabricante || undefined,
        },
      });

      // 4. Registar a mudança na auditoria (se o client gerado expuser o model)
      const auditoriaClient = (tx as unknown as {
        auditoria?: {
          create: (args: {
            data: {
              tabela: string;
              tipoOperacao: string;
              idRegisto: number;
              descricao?: string;
              usuario?: string;
              dadosAntes?: string;
              dadosDepois?: string;
            };
          }) => Promise<unknown>;
        };
      }).auditoria;

      if (auditoriaClient) {
        await auditoriaClient.create({
          data: {
            tabela: 'ArtigoJangada',
            tipoOperacao: 'UPDATE',
            idRegisto: artigoAtual.id,
            descricao: `Substituição de artigo: ${artigoAtual.name} (${referenciaAtual}) → ${novoStock.descricao} (${novaReferencia})`,
            usuario: 'sistema',
            dadosAntes: JSON.stringify({
              referencia: referenciaAtual,
              name: artigoAtual.name,
              quantidade: artigoAtual.quantidade,
            }),
            dadosDepois: JSON.stringify({
              referencia: novaReferencia,
              name: novoStock.descricao,
              quantidade: quantidade || artigoAtual.quantidade,
            }),
          },
        });
      }

      return artigoAtualizado;
    });

    return NextResponse.json({
      success: true,
      artigo: resultado,
      mensagem: 'Artigo substituído com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao substituir artigo:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao substituir artigo' },
      { status: 500 }
    );
  }
}
