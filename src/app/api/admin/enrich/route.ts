import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function parseMarcaModelo(mm: string) {
  if (!mm) return { brand: '', model: '' }
  const parts = mm.trim().split(/\s+/)
  if (parts.length === 1) return { brand: parts[0], model: '' }
  return { brand: parts[0], model: parts.slice(1).join(' ') }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const apply = Boolean(body.apply)
  const csvFile = path.join(process.cwd(), 'scripts', 'jangadas_lista_completa_dedup.csv')
  if (!fs.existsSync(csvFile)) return NextResponse.json({ ok: false, error: 'CSV not found' }, { status: 400 })

  const raw = fs.readFileSync(csvFile, 'utf8')
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  lines.shift()
  const changes: Array<{
    serial: string
    jangadaId: number
    before: { brand: string | null; model: string | null; capacity: number | null; packType: string | null }
    after: Prisma.JangadaUpdateInput
  }> = []

  for (const line of lines) {
    const cols = line.split(';')
    const serial = cols[1]?.trim()
    const marca_modelo = cols[3]?.trim() || ''
    const lotacao = parseInt(cols[4] || '0', 10) || 0
    const pack_type = cols[5]?.trim() || ''

    if (!serial) continue
    const jangada = await prisma.jangada.findUnique({ where: { serial } })
    if (!jangada) continue

    const parsed = parseMarcaModelo(marca_modelo)
    const updateData: Prisma.JangadaUpdateInput = {}
    // Preencher ou atualizar se o CSV for mais completo
    if ((parsed.brand && (!jangada.brand || jangada.brand.length < parsed.brand.length))) updateData.brand = parsed.brand
    if ((parsed.model && (!jangada.model || jangada.model.length < parsed.model.length))) updateData.model = parsed.model
    if (lotacao > 0 && (!jangada.capacity || lotacao > jangada.capacity)) updateData.capacity = lotacao
    if ((pack_type && (!jangada.packType || jangada.packType.length < pack_type.length))) updateData.packType = pack_type
    if (Object.keys(updateData).length > 0) {
      changes.push({ serial, jangadaId: jangada.id, before: { brand: jangada.brand, model: jangada.model, capacity: jangada.capacity, packType: jangada.packType }, after: updateData })
      if (apply) {
        await prisma.jangada.update({ where: { id: jangada.id }, data: updateData }).catch(() => {})
      }
    }
  }

  await prisma.$disconnect()
  return NextResponse.json({ ok: true, persisted: false, count: changes.length, generatedAt: new Date().toISOString(), changes })
}
