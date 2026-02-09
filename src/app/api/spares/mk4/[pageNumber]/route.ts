import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageNumber: string }> }
) {
  try {
    const { pageNumber: pageNumberStr } = await params;
    const pageNumber = parseInt(pageNumberStr)
    
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 680) {
      return NextResponse.json(
        { error: 'Número de página inválido. Deve estar entre 1 e 680.' },
        { status: 400 }
      )
    }

    // Caminho para a imagem
    const imagePath = path.join(
      process.cwd(),
      'spare_parts_images',
      'MK_IV',
      `page_${pageNumber.toString().padStart(3, '0')}.png`
    )

    // Verificar se arquivo existe
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Ler arquivo
    const imageBuffer = fs.readFileSync(imagePath)

    // Retornar imagem
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Erro ao servir imagem:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar imagem' },
      { status: 500 }
    )
  }
}
