import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar verificações de checklist de uma inspeção
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspecaoId } = await params

    const verificacoes = await prisma.verificacaoChecklistInspecao.findMany({
      where: { inspecaoId },
      include: {
        checklistItem: true
      },
      orderBy: {
        checklistItem: {
          ordem: 'asc'
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: verificacoes
    })
  } catch (error) {
    console.error('[API] Erro ao buscar verificações:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar verificações do checklist',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST - Salvar checklist (compatibilidade com implementação antiga + nova)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspecaoId } = await params
    const body = await request.json()

    // Nova implementação - verificações individuais
    if (body.items && Array.isArray(body.items)) {
      const { items } = body

      // Verificar se a inspeção existe
      const inspecao = await prisma.inspecao.findUnique({
        where: { id: inspecaoId }
      })

      if (!inspecao) {
        return NextResponse.json(
          { success: false, error: 'Inspeção não encontrada' },
          { status: 404 }
        )
      }

      // Salvar/atualizar verificações
      const results = []
      for (const item of items) {
        const { checklistItemId, verificado, aprovado, valor, observacoes } = item

        const verificacao = await prisma.verificacaoChecklistInspecao.upsert({
          where: {
            checklistItemId_inspecaoId: {
              checklistItemId,
              inspecaoId
            }
          },
          update: {
            verificado,
            aprovado,
            valor,
            observacoes,
            dataVerificacao: new Date()
          },
          create: {
            checklistItemId,
            inspecaoId,
            verificado,
            aprovado,
            valor,
            observacoes
          }
        })

        results.push(verificacao)
      }

      return NextResponse.json({ 
        success: true, 
        data: results,
        count: results.length,
        message: 'Checklist salvo com sucesso'
      })
    }

    // Implementação antiga - manter compatibilidade
    const {
      checklistItens = [],
      testesPressao = [],
      resumo = {}
    } = body

    // Salvar checklist na inspeção
    const inspecaoAtualizada = await prisma.inspecao.update({
      where: { id: inspecaoId },
      data: {
        status: 'concluida',
        // Armazenar dados como JSON em observacoes
        observacoes: JSON.stringify({
          checklistItens,
          testesPressao,
          resumo,
        }),
      },
      include: {
        jangada: {
          select: { id: true, numeroSerie: true }
        },
        obra: true
      }
    })

    return NextResponse.json({
      success: true,
      inspecao: inspecaoAtualizada,
      message: 'Checklist salvo com sucesso',
    })
  } catch (error) {
    console.error('Erro ao salvar checklist:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar checklist' },
      { status: 500 }
    )
  }
}
