import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        navios: {
          include: {
            jangadas: true,
            certificados: true,
            inspecoes: true
          }
        },
        obras: true,
        jangadas: {
          include: {
            navio: true,
            inspecoes: true
          }
        },
        faturas: true
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: cliente,
      stats: {
        totalNavios: cliente.navios.length,
        totalJangadas: cliente.jangadas.length,
        totalObras: cliente.obras.length,
        totalFaturas: cliente.faturas.length
      }
    })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    )
  }
}
