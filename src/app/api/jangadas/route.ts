import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getComponentesNecessarios,
  incrementarStockComponentes
} from '@/lib/stock-utils';
import { createJangadaFolder } from '@/lib/onedrive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const clienteId = searchParams.get('clienteId');
    const navioId = searchParams.get('navioId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tecnico = searchParams.get('tecnico');

    const where: any = {};

    if (tecnico) {
      where.tecnico = tecnico;
    }

    if (search) {
      where.OR = [
        { numeroSerie: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { proprietario: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (clienteId) {
      where.navio = {
        clienteId: clienteId
      };
    }

    if (navioId) {
      where.navioId = navioId;
    }

    const total = await prisma.jangada.count({ 
      where,
      cacheStrategy: { ttl: 300 } // Cache por 5 minutos
    });

    const jangadas = await prisma.jangada.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: true,
        proprietario: true,
        marca: true,
        modelo: true,
        lotacao: true,
      },
      cacheStrategy: { ttl: 300 } // Cache por 5 minutos
    });

    return NextResponse.json({
      data: jangadas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar jangadas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Extrair componentes necessários
    const componentesNecessarios = getComponentesNecessarios(
      data.tipo,
      data.tipoPack,
      undefined, // componentesJangada - não usado mais
      undefined, // componentesPack - não usado mais
      data.componentesSelecionados
    );

    // Usar transação para criar jangada, cilindro e atualizar stock
    const result = await prisma.$transaction(async (tx) => {
      // Criar jangada
      const jangada = await tx.jangada.create({
        data: {
          numeroSerie: data.numeroSerie,
          marcaId: data.marcaId,
          modeloId: data.modeloId,
          tipo: data.tipo,
          lotacaoId: data.lotacaoId,
          tipoPackId: data.tipoPackId,
          itensTipoPack: data.itensTipoPack,
          dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao) : null,
          dataInspecao: data.dataInspecao ? new Date(data.dataInspecao) : null,
          dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao) : null,
          status: data.status || 'ativo',
          estado: data.estado || 'instalada',
          tecnico: data.tecnico || 'Julio Correia',
          clienteId: data.clienteId,
          proprietarioId: data.proprietarioId,
          navioId: data.navioId,
        },
        include: {
          cliente: true,
          proprietario: true,
          navio: true,
          marca: true,
          modelo: true,
          lotacao: true,
        },
      });

      // Adicionar TODOS os componentes e itens do pack ao stock automaticamente
      if (componentesNecessarios.length > 0) {
        for (const componente of componentesNecessarios) {
          // Verificar se item existe no stock
          const itemStock = await tx.stock.findFirst({
            where: {
              nome: componente.nome,
              status: 'ativo',
            },
          });

          if (itemStock) {
            // Incrementar quantidade
            await tx.stock.update({
              where: { id: itemStock.id },
              data: {
                quantidade: itemStock.quantidade + componente.quantidadeNecessaria,
              },
            });
          } else {
            // Criar item novo no stock
            await tx.stock.create({
              data: {
                nome: componente.nome,
                categoria: 'Componentes Jangada',
                quantidade: componente.quantidadeNecessaria,
                quantidadeMinima: 1,
                precoUnitario: 0,
                status: 'ativo',
                refOrey: `JANGADA-${jangada.numeroSerie}`,
              },
            });
          }

          // Registrar movimentação
          const itemStockFinal = await tx.stock.findFirst({
            where: {
              nome: componente.nome,
              status: 'ativo',
            },
          });

          if (itemStockFinal) {
            await tx.movimentacaoStock.create({
              data: {
                stockId: itemStockFinal.id,
                tipo: 'entrada',
                quantidade: componente.quantidadeNecessaria,
                motivo: `Adição automática ao criar jangada ${jangada.numeroSerie}`,
                responsavel: data.tecnico || 'Sistema',
              },
            });
          }
        }
      }

      return jangada;
    });

    // Create OneDrive folder for jangada if it has a navio
    if (result.navioId && result.navio) {
      try {
        const folderId = await createJangadaFolder(
          result.navio.nome,
          result.numeroSerie,
          result.marca?.nome || 'Unknown',
          result.modelo?.nome || 'Unknown',
          result.lotacao?.capacidade || 8,
          result.dataInspecao,
          result.dataProximaInspecao,
          result.cliente?.nome || 'N/A'
        );
        console.log(`Pasta e arquivo Excel criados no OneDrive para a jangada ${result.numeroSerie}: ${folderId}`);
      } catch (onedriveError) {
        console.error('Erro ao criar pasta e arquivo no OneDrive para jangada:', onedriveError);
        // Don't fail the jangada creation if OneDrive fails
      }
    }

    return NextResponse.json({
      ...result,
      message: `Jangada criada com sucesso. ${componentesNecessarios.length} componentes adicionados ao stock.`,
    });

  } catch (error) {
    console.error('Erro ao criar jangada:', error);
    return NextResponse.json(
      { error: 'Erro ao criar jangada' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}