import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const outDir = path.join(process.cwd(), 'prisma', 'logs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')

  console.log('Exporting jangadas...')
  const jangadas = await prisma.jangada.findMany()
  fs.writeFileSync(path.join(outDir, `backup_jangadas_${ts}.json`), JSON.stringify(jangadas, null, 2))

  console.log('Exporting inspecoes referencing jangadas...')
  const inspecoes = await prisma.inspecao.findMany({ where: { jangadaId: { not: null } } })
  fs.writeFileSync(path.join(outDir, `backup_inspecoes_with_jangada_${ts}.json`), JSON.stringify(inspecoes, null, 2))

  console.log('Exporting certificados extraidos with raftSerial...')
  const certificados = await prisma.certificadoExtraido.findMany({ where: { raftSerial: { not: null } } })
  fs.writeFileSync(path.join(outDir, `backup_certificados_extraidos_${ts}.json`), JSON.stringify(certificados, null, 2))

  const certificadoIds = certificados.map(c => c.id)
  if (certificadoIds.length > 0) {
    console.log('Exporting validades for those certificados...')
    const validades = await prisma.certificadoValidade.findMany({ where: { certificadoId: { in: certificadoIds } } })
    fs.writeFileSync(path.join(outDir, `backup_certificados_validades_${ts}.json`), JSON.stringify(validades, null, 2))
  }

  console.log('Backups written to', outDir)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
