import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria')

    const where: any = { status: 'ativo' }

    if (categoria) {
      where.categoria = categoria
    }

    const componentes = await prisma.stock.findMany({
      where,
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      data: componentes,
      success: true
    })
  } catch (error) {
    console.error('Erro ao buscar componentes da jangada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, categoria } = body

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!categoria || typeof categoria !== 'string' || categoria.trim().length === 0) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const existing = await prisma.stock.findFirst({
      where: {
        nome: nome.trim(),
        status: 'ativo'
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Componente já existe' },
        { status: 400 }
      )
    }

    const componente = await prisma.stock.create({
      data: {
        nome: nome.trim(),
        categoria: categoria.trim(),
        status: 'ativo'
      }
    })

    return NextResponse.json({
      data: componente,
      success: true
    })
  } catch (error) {
    console.error('Erro ao criar componente da jangada:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}