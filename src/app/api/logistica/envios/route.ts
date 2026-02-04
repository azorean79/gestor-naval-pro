import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const envios = await prisma.envio.findMany({
      include: {
        itens: {
          include: {
            stock: true,
            jangada: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(envios);
  } catch (error) {
    console.error('Erro ao buscar envios:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      numeroRastreio,
      tipo,
      metodoEnvio,
      transportadora,
      destinatarioNome,
      destinatarioEmail,
      destinatarioTelefone,
      enderecoEntrega,
      itens,
      custoEnvio,
      observacoes,
      responsavel
    } = body;

    // Criar o envio
    const envio = await prisma.envio.create({
      data: {
        numeroRastreio,
        tipo,
        metodoEnvio,
        transportadora,
        destinatarioNome,
        destinatarioEmail,
        destinatarioTelefone,
        enderecoEntrega,
        custoEnvio,
        observacoes,
        responsavel: responsavel || 'Julio Correia',
        itens: {
          create: itens.map((item: any) => ({
            tipoItem: item.tipoItem,
            stockId: item.tipoItem === 'stock' ? item.itemId : null,
            jangadaId: item.tipoItem === 'jangada' ? item.itemId : null,
            quantidade: item.quantidade || 1,
            descricao: item.descricao
          }))
        }
      },
      include: {
        itens: {
          include: {
            stock: true,
            jangada: true
          }
        }
      }
    });

    // Atualizar quantidades no stock se for envio de stock
    for (const item of itens) {
      if (item.tipoItem === 'stock') {
        await prisma.stock.update({
          where: { id: item.itemId },
          data: {
            quantidade: {
              decrement: item.quantidade || 1
            }
          }
        });

        // Registrar movimentação de saída
        await prisma.movimentacaoStock.create({
          data: {
            stockId: item.itemId,
            tipo: 'saida',
            quantidade: item.quantidade || 1,
            motivo: `Envio ${numeroRastreio || 'sem rastreio'} para ${destinatarioNome}`,
            responsavel: responsavel || 'Julio Correia'
          }
        });
      }
    }

    return NextResponse.json(envio, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar envio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}