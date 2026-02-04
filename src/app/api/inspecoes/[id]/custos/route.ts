import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const custos = await prisma.custoInspecao.findMany({
      where: { inspecaoId: id },
      orderBy: { createdAt: 'desc' },
    })

    const total = custos.reduce((sum, c) => sum + c.valor, 0)

    return NextResponse.json({
      custos,
      total,
      count: custos.length,
    })
  } catch (error) {
    console.error('Erro ao buscar custos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar custos' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      tipoServico,
      descricao,
      valor,
      quantidade,
      responsavel,
    } = body

    const custo = await prisma.custoInspecao.create({
      data: {
        inspecaoId: id,
        tipo: tipoServico,
        descricao,
        valor,
        quantidade: quantidade || 1,
        responsavel,
      },
    })

    return NextResponse.json(custo, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar custo:', error)
    return NextResponse.json(
      { error: 'Erro ao criar custo' },
      { status: 500 }
    )
  }
}
