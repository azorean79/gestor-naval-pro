import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tiposValvula = await prisma.tipoValvula.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      data: tiposValvula,
      success: true
    })
  } catch (error) {
    console.error('Erro ao buscar tipos de válvula:', error)
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
    await prisma.$queryRaw`CREATE TABLE IF NOT EXISTS "tipos_valvula" (
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
    const existing = await prisma.tipoValvula.findFirst({
      where: {
        nome: nome.trim(),
        ativo: true
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Tipo de válvula já existe' },
        { status: 400 }
      )
    }

    const tipoValvula = await prisma.tipoValvula.create({
      data: {
        nome: nome.trim()
      }
    })

    return NextResponse.json({
      data: tipoValvula,
      success: true
    })
  } catch (error) {
    console.error('Erro ao criar tipo de válvula:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}