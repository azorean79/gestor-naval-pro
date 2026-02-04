import { NextRequest, NextResponse } from 'next/server'
import { config } from 'dotenv'
config()

import { prisma } from '@/lib/prisma'

// PATCH /api/tarefas/[id]/concluir - Marcar tarefa como concluída
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tarefa = await prisma.tarefa.update({
      where: { id: id },
      data: {
        status: 'concluida',
        dataConclusao: new Date()
      },
      include: {
        stock: {
          select: {
            id: true,
            nome: true,
            categoria: true
          }
        },
        cliente: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: tarefa
    })
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}