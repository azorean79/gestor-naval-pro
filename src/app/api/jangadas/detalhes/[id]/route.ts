import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    type JangadaDetalhe = Prisma.JangadaGetPayload<{
      include: {
        cliente: true
        navio: { include: { cliente: true } }
        marca: true
        modelo: true
        inspecoes: true
        certificados: true
      }
    }>

    const jangada = await prisma.jangada.findUnique({
      where: { id },
      include: {
        cliente: true,
        navio: {
          include: {
            cliente: true
          }
        },
        marca: true,
        modelo: true,
        inspecoes: true,
        certificados: true
      }
    }) as JangadaDetalhe | null

    if (!jangada) {
      return NextResponse.json(
        { error: 'Jangada não encontrada' },
        { status: 404 }
      )
    }

    // Calcular próximos testes SOLAS
    const anoConstrucao = jangada.dataFabricacao
      ? new Date(jangada.dataFabricacao).getFullYear()
      : new Date().getFullYear()
    const idade = new Date().getFullYear() - anoConstrucao
    
    const testesSolas = {
      visual: { obrigatorio: true, frequencia: '1 ano' },
      pressao: { obrigatorio: idade >= 5, frequencia: '5 anos' },
      fullService: { obrigatorio: idade >= 10, frequencia: '10 anos' },
      nap: { obrigatorio: idade >= 10, frequencia: '10 anos' }
    }

    return NextResponse.json({
      data: jangada,
      stats: {
        idade: idade,
        status: jangada.status,
        diasParaProximoTeste: jangada.dataProximaInspecao 
          ? Math.ceil((new Date(jangada.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
        totalInspecoes: jangada.inspecoes.length,
        ultimaInspecao: jangada.inspecoes[0]?.createdAt || null
      },
      testesSolas
    })
  } catch (error) {
    console.error('Erro ao buscar jangada:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar jangada' },
      { status: 500 }
    )
  }
}
