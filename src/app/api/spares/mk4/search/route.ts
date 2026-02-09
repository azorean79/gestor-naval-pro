import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface SparePartsData {
  manual: string
  componentes_numerados: Array<{
    numero: number
    nome: string
    tipo: string
    imagem?: string
    pagina?: number
  }>
  spares: Array<{
    descricao: string
    secao?: number
    fonte?: string
  }>
  referencias: string[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query de busca muito curta. Mínimo 2 caracteres.' },
        { status: 400 }
      )
    }

    // Carregar dados de spare parts
    const dataPath = path.join(
      process.cwd(),
      'MK_IV_spare_parts_complete.json'
    )

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Dados de spare parts não encontrados' },
        { status: 404 }
      )
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const sparePartsData: SparePartsData = JSON.parse(rawData)

    const searchTerm = query.toLowerCase().trim()

    // Buscar em componentes numerados
    const matchingComponents = sparePartsData.componentes_numerados.filter(
      (comp) => comp.nome.toLowerCase().includes(searchTerm)
    )

    // Buscar em spares
    const matchingSpares = sparePartsData.spares.filter(
      (spare) => spare.descricao.toLowerCase().includes(searchTerm)
    )

    // Buscar em referências
    const matchingReferences = sparePartsData.referencias.filter((ref) =>
      ref.toLowerCase().includes(searchTerm)
    )

    const results = {
      query: query,
      total: matchingComponents.length + matchingSpares.length + matchingReferences.length,
      componentes: matchingComponents.slice(0, 50), // Limitar a 50
      spares: matchingSpares.slice(0, 50),
      referencias: matchingReferences.slice(0, 20),
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Erro ao buscar spare parts:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar spare parts' },
      { status: 500 }
    )
  }
}
