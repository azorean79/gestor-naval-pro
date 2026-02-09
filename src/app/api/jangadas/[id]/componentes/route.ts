import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getComponentesNecessarios } from '@/lib/stock-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jangadaId } = await params

    // Buscar a jangada
    const jangada = await prisma.jangada.findUnique({
      where: { id: jangadaId },
      select: {
        id: true,
        tipo: true,
        tipoPack: true,
        itensTipoPack: true
      }
    })

    if (!jangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      )
    }

    // Obter componentes necessários
    let componentesNecessarios: any[] = []

    if (jangada.itensTipoPack) {
      try {
        // Se tem itensTipoPack (formato JSON), usar esse
        const componentesSelecionados = JSON.parse(jangada.itensTipoPack)
        componentesNecessarios = getComponentesNecessarios(
          jangada.tipo,
          jangada.tipoPack || undefined,
          undefined,
          undefined,
          componentesSelecionados
        )
      } catch (error) {
        console.error('Erro ao parsear itensTipoPack:', error)
        // Fallback para componentes padrão
        componentesNecessarios = getComponentesNecessarios(jangada.tipo, jangada.tipoPack || undefined)
      }
    } else {
      // Usar componentes padrão baseados no tipo e pack
      componentesNecessarios = getComponentesNecessarios(jangada.tipo, jangada.tipoPack || undefined)
    }

    // Para cada componente, buscar itens em stock disponíveis
    const componentesComStock = await Promise.all(
      componentesNecessarios.map(async (componente) => {
        const stockItems = await prisma.stock.findMany({
          where: {
            nome: componente.nome,
            status: 'ativo',
            quantidade: {
              gt: 0
            }
          },
          select: {
            id: true,
            nome: true,
            quantidade: true,
            refOrey: true,
            refFabricante: true,
            lote: true,
            fornecedor: true,
            localizacao: true
          },
          orderBy: {
            createdAt: 'asc' // Itens mais antigos primeiro
          }
        })

        return {
          ...componente,
          stockItems
        }
      })
    )

    return NextResponse.json({
      data: componentesComStock,
      total: componentesComStock.length
    })

  } catch (error) {
    console.error('Erro ao buscar componentes da jangada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}