import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sistemasCilindro = await prisma.sistemaCilindro.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      data: sistemasCilindro,
      success: true
    })
  } catch (error) {
    console.error('Erro ao buscar sistemas de cilindro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    // Ensure table exists
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "sistemas_cilindro" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "nome" TEXT,
      "ativo" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`;

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const existing = await prisma.sistemaCilindro.findFirst({
      where: {
        nome: nome.trim(),
        ativo: true
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Sistema de cilindro já existe' },
        { status: 400 }
      )
    }

    const sistemaCilindro = await prisma.sistemaCilindro.create({
      data: {
        nome: nome.trim()
      }
    })

    return NextResponse.json({
      data: sistemaCilindro,
      success: true
    })
  } catch (error) {
    console.error('Erro ao criar sistema de cilindro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}