import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface SpareReferenceBody {
  spare_id: string
  reference: string
  imagem: string
  descricao?: string
  pagina?: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: componenteId } = await params
    const body: SpareReferenceBody = await request.json()

    // Validar dados
    if (!body.spare_id || !body.reference || !body.imagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: spare_id, reference, imagem' },
        { status: 400 }
      )
    }

    // Verificar se componente existe
    const componente = await prisma.inspecaoComponente.findUnique({
      where: { id: componenteId },
    })

    if (!componente) {
      return NextResponse.json(
        { error: 'Componente não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados de spare reference
    const spareReferenceData = {
      spare_id: body.spare_id,
      reference: body.reference,
      imagem: body.imagem,
      descricao: body.descricao || null,
      pagina: body.pagina || null,
      data_associacao: new Date().toISOString(),
    }

    // Atualizar componente com referência (usando campo notas ou criar campo JSON)
    const notasAtuais = componente.notas ? JSON.parse(componente.notas) : {}
    const spareReferences = notasAtuais.spare_references || []
    
    spareReferences.push(spareReferenceData)
    notasAtuais.spare_references = spareReferences

    const componenteAtualizado = await prisma.inspecaoComponente.update({
      where: { id: componenteId },
      data: {
        notas: JSON.stringify(notasAtuais),
      },
    })

    return NextResponse.json({
      success: true,
      componente_id: componenteAtualizado.id,
      spare_reference: spareReferenceData,
      total_references: spareReferences.length,
    })
  } catch (error) {
    console.error('Erro ao adicionar spare reference:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar spare reference' },
      { status: 500 }
    )
  }
}

// GET - Buscar spare references de um componente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: componenteId } = await params

    const componente = await prisma.inspecaoComponente.findUnique({
      where: { id: componenteId },
      select: {
        id: true,
        nome: true,
        notas: true,
        codigoFabricante: true,
        referenciaOrey: true,
      },
    })

    if (!componente) {
      return NextResponse.json(
        { error: 'Componente não encontrado' },
        { status: 404 }
      )
    }

    const notasData = componente.notas ? JSON.parse(componente.notas) : {}
    const spareReferences = notasData.spare_references || []

    return NextResponse.json({
      componente_id: componente.id,
      nome: componente.nome,
      codigo_fabricante: componente.codigoFabricante,
      referencia_orey: componente.referenciaOrey,
      spare_references: spareReferences,
      total: spareReferences.length,
    })
  } catch (error) {
    console.error('Erro ao buscar spare references:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar spare references' },
      { status: 500 }
    )
  }
}

// DELETE - Remover spare reference específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: componenteId } = await params
    const searchParams = request.nextUrl.searchParams
    const spareId = searchParams.get('spare_id')

    if (!spareId) {
      return NextResponse.json(
        { error: 'spare_id é obrigatório' },
        { status: 400 }
      )
    }

    const componente = await prisma.inspecaoComponente.findUnique({
      where: { id: componenteId },
    })

    if (!componente) {
      return NextResponse.json(
        { error: 'Componente não encontrado' },
        { status: 404 }
      )
    }

    const notasAtuais = componente.notas ? JSON.parse(componente.notas) : {}
    let spareReferences = notasAtuais.spare_references || []
    
    // Filtrar removendo a spare_id
    const initialCount = spareReferences.length
    spareReferences = spareReferences.filter(
      (ref: any) => ref.spare_id !== spareId
    )

    if (spareReferences.length === initialCount) {
      return NextResponse.json(
        { error: 'Spare reference não encontrada' },
        { status: 404 }
      )
    }

    notasAtuais.spare_references = spareReferences

    await prisma.inspecaoComponente.update({
      where: { id: componenteId },
      data: {
        notas: JSON.stringify(notasAtuais),
      },
    })

    return NextResponse.json({
      success: true,
      removed: true,
      remaining: spareReferences.length,
    })
  } catch (error) {
    console.error('Erro ao remover spare reference:', error)
    return NextResponse.json(
      { error: 'Erro ao remover spare reference' },
      { status: 500 }
    )
  }
}
