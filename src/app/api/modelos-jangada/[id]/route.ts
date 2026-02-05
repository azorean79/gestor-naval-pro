import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const modelo = await prisma.modeloJangada.findUnique({
      where: { id },
      include: {
        marca: true,
        itensModelo: {
          include: {
            stock: true,
          },
        },
      },
    })

    if (!modelo) {
      return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ...modelo,
      status: modelo.ativo ? 'ativo' : 'inativo',
    })
  } catch (error) {
    console.error('Error fetching modelo:', error)
    return NextResponse.json({ error: 'Failed to fetch modelo' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: any = {}
    if (typeof body.nome === 'string') data.nome = body.nome
    if (typeof body.marcaId === 'string') data.marcaId = body.marcaId
    if (typeof body.sistemaInsuflacao === 'string' || body.sistemaInsuflacao === null) {
      data.sistemaInsuflacao = body.sistemaInsuflacao
    }
    if (typeof body.valvulasPadrao === 'string' || body.valvulasPadrao === null) {
      data.valvulasPadrao = body.valvulasPadrao
    }
    if (typeof body.status === 'string') data.ativo = body.status === 'ativo'

    const hasItensModelo = Object.prototype.hasOwnProperty.call(body, 'itensModelo')
    const itensModelo = Array.isArray(body.itensModelo) ? body.itensModelo : []
    const itensModeloData = itensModelo
      .filter((item: any) => item?.stockId)
      .map((item: any) => ({
        modeloId: id,
        stockId: item.stockId,
        quantidade: typeof item.quantidade === 'number' && item.quantidade > 0 ? item.quantidade : 1,
      }))

    await prisma.$transaction(async (tx) => {
      await tx.modeloJangada.update({
        where: { id },
        data,
      })

      if (hasItensModelo) {
        await tx.modeloJangadaItem.deleteMany({ where: { modeloId: id } })
        if (itensModeloData.length > 0) {
          await tx.modeloJangadaItem.createMany({ data: itensModeloData })
        }
      }
    })

    const updated = await prisma.modeloJangada.findUnique({
      where: { id },
      include: {
        marca: true,
        itensModelo: {
          include: {
            stock: true,
          },
        },
      },
    })

    if (!updated) {
      return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ...updated,
      status: updated.ativo ? 'ativo' : 'inativo',
    })
  } catch (error) {
    console.error('Error updating modelo:', error)
    return NextResponse.json({ error: 'Failed to update modelo' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.modeloJangada.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting modelo:', error)
    return NextResponse.json({ error: 'Failed to delete modelo' }, { status: 500 })
  }
}
