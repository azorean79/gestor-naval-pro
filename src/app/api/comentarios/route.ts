import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const navioId = searchParams.get('navioId')
  const inspecaoId = searchParams.get('inspecaoId')

  const where = navioId
    ? { navioId }
    : inspecaoId
    ? { inspecaoId }
    : {}

  const comentarios = await prisma.comentario.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(comentarios)
}

export async function POST(request: Request) {
  const { texto, autor, navioId, inspecaoId } = await request.json()
  const comentario = await prisma.comentario.create({
    data: { texto, autor, navioId, inspecaoId, tipo: 'navio' },
  })
  return NextResponse.json(comentario)
}
