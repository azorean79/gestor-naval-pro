import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseMarcaModelo(mm: string) {
  if (!mm) return { brand: '', model: '' }
  const parts = mm.trim().split(/\s+/)
  if (parts.length === 1) return { brand: parts[0], model: '' }
  return { brand: parts[0], model: parts.slice(1).join(' ') }
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const csvFile = path.join(process.cwd(), 'scripts', 'jangadas_lista_completa_dedup.csv')
  if (!fs.existsSync(csvFile)) {
    console.error('CSV not found:', csvFile)
    process.exit(1)
  }
  const outDir = path.join(process.cwd(), 'prisma', 'logs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const raw = fs.readFileSync(csvFile, 'utf8')
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  const header = lines.shift()
  const changes: any[] = []

  for (const line of lines) {
    // semicolon separated: num;serial;navio;marca_modelo;lotacao;pack_type;artigos_count;artigos_json
    const cols = line.split(';')
    const serial = cols[1]?.trim()
    const marca_modelo = cols[3]?.trim() || ''
    const lotacao = parseInt(cols[4] || '0', 10) || 0
    const pack_type = cols[5]?.trim() || ''
    const artigos_json = cols[7] || ''

    if (!serial) continue
    const jangada = await prisma.jangada.findUnique({ where: { serial } })
    if (!jangada) continue

    const parsed = parseMarcaModelo(marca_modelo)
    const updateData: any = {}
    if ((!jangada.brand || jangada.brand === '') && parsed.brand) updateData.brand = parsed.brand
    if ((!jangada.model || jangada.model === '') && parsed.model) updateData.model = parsed.model
    if ((!jangada.capacity || jangada.capacity === 0) && lotacao > 0) updateData.capacity = lotacao
    if ((!jangada.packType || jangada.packType === '') && pack_type) updateData.packType = pack_type
    if ((!jangada.artigos || jangada.artigos === '') && artigos_json) updateData.artigos = artigos_json

    if (Object.keys(updateData).length > 0) {
      changes.push({ serial, jangadaId: jangada.id, before: { brand: jangada.brand, model: jangada.model, capacity: jangada.capacity, packType: jangada.packType, artigos: jangada.artigos }, after: updateData })
      if (apply) {
        try {
          await prisma.jangada.update({ where: { id: jangada.id }, data: updateData })
        } catch (e) {
          console.error('Failed update for', serial, e)
        }
      }
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g,'-')
  const outFile = path.join(outDir, `enrich_jangadas_dryrun_${ts}.json`)
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), apply, changes }, null, 2))
  console.log(`Wrote ${changes.length} proposed changes to ${outFile}`)

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
