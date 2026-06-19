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
  const csvFile = path.join(process.cwd(), 'scripts', 'jangadas_lista_completa_dedup.csv')
  if (!fs.existsSync(csvFile)) {
    console.error('CSV not found:', csvFile)
    process.exit(1)
  }
  const raw = fs.readFileSync(csvFile, 'utf8')
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  lines.shift()
  let created = 0, updated = 0, errors = 0
  for (const line of lines) {
    const cols = line.split(';')
    const serial = cols[1]?.trim()
    const navio = cols[2]?.trim() || ''
    const marca_modelo = cols[3]?.trim() || ''
    const lotacao = parseInt(cols[4] || '0', 10) || 0
    const pack_type = cols[5]?.trim() || ''
    const artigos_json = cols[7] || ''
    if (!serial) continue
    const parsed = parseMarcaModelo(marca_modelo)
    try {
      const existing = await prisma.jangada.findUnique({ where: { serial } })
      if (existing) {
        await prisma.jangada.update({
          where: { serial },
          data: {
            brand: parsed.brand,
            model: parsed.model,
            capacity: lotacao,
            packType: pack_type,
            artigos: artigos_json,
            owner: navio,
          }
        })
        updated++
      } else {
        await prisma.jangada.create({
          data: {
            serial,
            brand: parsed.brand,
            model: parsed.model,
            capacity: lotacao,
            packType: pack_type,
            artigos: artigos_json,
            owner: navio,
            dataFabrico: '',
          }
        })
        created++
      }
    } catch (e) {
      errors++
      console.error('Erro em', serial, e)
    }
  }
  console.log(`Seed concluído. Criados: ${created}, Atualizados: ${updated}, Erros: ${errors}`)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
