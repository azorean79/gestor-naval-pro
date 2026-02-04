import { NextRequest, NextResponse } from 'next/server'
import { config } from 'dotenv'
config()

import { prisma } from '@/lib/prisma'

// GET /api/tarefas - Listar todas as tarefas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tipo = searchParams.get('tipo')
    const prioridade = searchParams.get('prioridade')
    const responsavel = searchParams.get('responsavel')

    const where: any = {}
    if (status) where.status = status
    if (tipo) where.tipo = tipo
    if (prioridade) where.prioridade = prioridade
    if (responsavel) where.responsavel = responsavel

    const tarefas = await prisma.tarefa.findMany({
      where,
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
      },
      orderBy: [
        { prioridade: 'desc' },
        { dataVencimento: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: tarefas
    })
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/tarefas - Criar nova tarefa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      titulo,
      descricao,
      tipo,
      prioridade = 'media',
      dataVencimento,
      contatoNome,
      contatoEmail,
      contatoTelefone,
      stockId,
      clienteId,
      quantidade,
      responsavel,
      notas
    } = body

    if (!titulo || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Título e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo,
        descricao,
        tipo,
        prioridade,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        contatoNome,
        contatoEmail,
        contatoTelefone,
        stockId,
        clienteId,
        quantidade,
        responsavel,
        notas,
        criadoPor: 'Sistema' // TODO: Pegar do usuário logado
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
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}