import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar todas as marcas e modelos de jangada
    const marcasJangada = await prisma.marcaJangada.findMany({
      include: { jangadas: true }
    })
    
    const modelosJangada = await prisma.modeloJangada.findMany({
      include: { jangadas: true }
    })

    const stats = {
      marcasJangada: marcasJangada.length,
      modelosJangada: modelosJangada.length,
      jangadasComMarca: marcasJangada.reduce((acc, m) => acc + m.jangadas.length, 0),
      jangadasComModelo: modelosJangada.reduce((acc, m) => acc + m.jangadas.length, 0)
    }

    return NextResponse.json({
      data: {
        marcasJangada,
        modelosJangada,
        stats,
        sincronizacao: {
          status: 'sincronizado',
          ultimaSincronizacao: new Date().toISOString(),
          modoManual: true
        }
      }
    })
  } catch (error) {
    console.error('Erro ao sincronizar marcas/modelos:', error)
    return NextResponse.json(
      { error: 'Erro ao sincronizar marcas/modelos' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { acao, tipo, dados } = body

    // Sincronizar marca de jangada
    if (acao === 'sincronizar-marca' && tipo === 'jangada') {
      const { nome, ativo } = dados
      const marca = await prisma.marcaJangada.upsert({
        where: { nome },
        update: { ativo: ativo ?? true },
        create: { nome, ativo: ativo ?? true }
      })
      return NextResponse.json({ data: marca, status: 'sincronizado' })
    }

    // Sincronizar modelo de jangada
    if (acao === 'sincronizar-modelo' && tipo === 'jangada') {
      const {
        nome,
        marcaId,
        marcaJangadaId,
        tipoPackId,
        sistemaInsuflacao,
        valvulasPadrao,
        ativo
      } = dados

      const marcaRef = marcaId || marcaJangadaId

      if (!marcaRef) {
        return NextResponse.json(
          { error: 'marcaId é obrigatório para sincronizar modelo' },
          { status: 400 }
        )
      }

      const modelo = await prisma.modeloJangada.upsert({
        where: {
          nome_marcaId: {
            nome,
            marcaId: marcaRef
          }
        },
        update: {
          sistemaInsuflacao: sistemaInsuflacao || null,
          valvulasPadrao: valvulasPadrao || null,
          ativo: ativo ?? true
        },
        create: {
          nome,
          marcaId: marcaRef,
          sistemaInsuflacao: sistemaInsuflacao || null,
          valvulasPadrao: valvulasPadrao || null,
          ativo: ativo ?? true
        }
      })
      return NextResponse.json({ data: modelo, status: 'sincronizado' })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao sincronizar:', error)
    return NextResponse.json(
      { error: 'Erro ao sincronizar' },
      { status: 500 }
    )
  }
}
