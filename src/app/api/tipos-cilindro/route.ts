import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tiposCilindro = await prisma.tipoCilindro.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      data: tiposCilindro,
      success: true
    })
  } catch (error) {
    console.error('Erro ao buscar tipos de cilindro:', error)
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

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const existing = await prisma.tipoCilindro.findFirst({
      where: {
        nome: nome.trim(),
        ativo: true
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Tipo de cilindro já existe' },
        { status: 400 }
      )
    }

    // Criar tabela se não existir
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "tipos_cilindro" (
        "id" TEXT PRIMARY KEY,
        "nome" TEXT NOT NULL UNIQUE,
        "descricao" TEXT,
        "ativo" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const tipoCilindro = await prisma.tipoCilindro.create({
      data: {
        nome: nome.trim()
      }
    })

    return NextResponse.json({
      data: tipoCilindro,
      success: true
    })
  } catch (error) {
    console.error('Erro ao criar tipo de cilindro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}