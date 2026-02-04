import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const navioId = searchParams.get('navioId')
    const jangadaId = searchParams.get('jangadaId')
    const cilindroId = searchParams.get('cilindroId')

    const where: any = {}
    if (navioId) where.navioId = navioId
    if (jangadaId) where.jangadaId = jangadaId
    if (cilindroId) where.cilindroId = cilindroId

    const cronogramas = await prisma.agendamento.findMany({
      where,
      orderBy: { dataInicio: 'asc' },
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
      },
    })

    return NextResponse.json(cronogramas)
  } catch (error) {
    console.error('Erro ao buscar cronogramas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cronogramas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      titulo,
      descricao,
      tipoManutencao,
      frequencia,
      proximaManutencao,
      prioridade,
      navioId,
      jangadaId,
      cilindroId,
      custoEstimado,
      responsavel,
    } = body

    const cronograma = await prisma.agendamento.create({
      data: {
        titulo,
        descricao,
        tipo: tipoManutencao,
        dataInicio: new Date(proximaManutencao),
        dataFim: new Date(proximaManutencao), // assuming same day
        prioridade: prioridade || 'normal',
        navioId: navioId || null,
        jangadaId: jangadaId || null,
        cilindroId: cilindroId || null,
        responsavel,
        status: 'ativo',
      },
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
      },
    })

    return NextResponse.json(cronograma, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cronograma' },
      { status: 500 }
    )
  }
}
