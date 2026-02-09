import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const navio = await prisma.navio.findUnique({
      where: { id },
      include: {
        cliente: true,
        jangadas: {
          include: {
            marca: true,
            modelo: true,
            inspecoes: true
          }
        },
        inspecoes: true,
        certificados: true
      }
    })

    if (!navio) {
      return NextResponse.json(
        { error: 'Navio não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: navio,
      stats: {
        totalJangadas: navio.jangadas?.length || 0,
        jangadasAticas: navio.jangadas?.filter((j: any) => j.estado === 'instalada').length || 0,
        totalInspecoes: navio.inspecoes?.length || 0,
        inspecoesAprovadas: navio.inspecoes?.filter((i: any) => i.resultado === 'aprovada').length || 0,
        totalObras: 0,
        obrasEmCurso: 0
      }
    })
  } catch (error) {
    console.error('Erro ao buscar navio:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar navio' },
      { status: 500 }
    )
  }
}
