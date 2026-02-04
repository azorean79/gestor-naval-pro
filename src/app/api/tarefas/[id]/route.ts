import { NextRequest, NextResponse } from 'next/server'
import { config } from 'dotenv'
config()

import { prisma } from '@/lib/prisma'

// GET /api/tarefas/[id] - Buscar tarefa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: id },
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

    if (!tarefa) {
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tarefa
    })
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/tarefas/[id] - Atualizar tarefa
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const {
      titulo,
      descricao,
      tipo,
      status,
      prioridade,
      dataVencimento,
      dataConclusao,
      contatoNome,
      contatoEmail,
      contatoTelefone,
      stockId,
      clienteId,
      quantidade,
      responsavel,
      notas
    } = body

    const updateData: any = {}
    if (titulo !== undefined) updateData.titulo = titulo
    if (descricao !== undefined) updateData.descricao = descricao
    if (tipo !== undefined) updateData.tipo = tipo
    if (status !== undefined) updateData.status = status
    if (prioridade !== undefined) updateData.prioridade = prioridade
    if (dataVencimento !== undefined) updateData.dataVencimento = dataVencimento ? new Date(dataVencimento) : null
    if (dataConclusao !== undefined) updateData.dataConclusao = dataConclusao ? new Date(dataConclusao) : null
    if (contatoNome !== undefined) updateData.contatoNome = contatoNome
    if (contatoEmail !== undefined) updateData.contatoEmail = contatoEmail
    if (contatoTelefone !== undefined) updateData.contatoTelefone = contatoTelefone
    if (stockId !== undefined) updateData.stockId = stockId
    if (clienteId !== undefined) updateData.clienteId = clienteId
    if (quantidade !== undefined) updateData.quantidade = quantidade
    if (responsavel !== undefined) updateData.responsavel = responsavel
    if (notas !== undefined) updateData.notas = notas

    const tarefa = await prisma.tarefa.update({
      where: { id: id },
      data: updateData,
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
    console.error('Erro ao atualizar tarefa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/tarefas/[id] - Excluir tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tarefa.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tarefa excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}