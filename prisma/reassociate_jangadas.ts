import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function latestFile(dir: string, pattern: RegExp) {
  const files = fs.readdirSync(dir).filter(f => pattern.test(f))
  if (files.length === 0) return null
  files.sort()
  return path.join(dir, files[files.length - 1])
}

async function main() {
  const logs = path.join(process.cwd(), 'prisma', 'logs')
  if (!fs.existsSync(logs)) {
    console.error('Logs folder not found:', logs)
    process.exit(1)
  }

  // build map serial -> jangada.id
  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true } })
  const map = new Map<string, number>()
  for (const j of jangadas) map.set((j.serial || '').toString().trim(), j.id)

  const result: any = { certificados: { attempted: 0, updated: 0 }, inspecoes: { attempted: 0, updated: 0 }, skipped: 0 }

  // Re-associate certificados using backup file
  const certFile = latestFile(logs, /^backup_certificados_extraidos_.*\.json$/)
  if (certFile) {
    console.log('Using certificado backup:', certFile)
    const raw = fs.readFileSync(certFile, 'utf8')
    let certs: any[] = []
    try { certs = JSON.parse(raw) } catch (e) { console.error('Failed parse certificados backup', e) }
    for (const c of certs) {
      if (!c.raftSerial) continue
      result.certificados.attempted++
      const serial = c.raftSerial.toString().trim()
      const jangadaId = map.get(serial)
      if (jangadaId) {
        try {
          await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: serial } })
          result.certificados.updated++
        } catch (e) {
          console.error('Failed update certificado id', c.id, e)
        }
      } else {
        result.skipped++
      }
    }
  } else {
    console.log('No certificado backup found to re-associate')
  }

  // Re-associate inspecoes using backup file
  const inspFile = latestFile(logs, /^backup_inspecoes_with_jangada_.*\.json$/)
  if (inspFile) {
    console.log('Using inspecoes backup:', inspFile)
    const raw = fs.readFileSync(inspFile, 'utf8')
    let insps: any[] = []
    try { insps = JSON.parse(raw) } catch (e) { console.error('Failed parse inspecoes backup', e) }
    for (const r of insps) {
      if (!r.jangadaSerial) continue
      result.inspecoes.attempted++
      const serial = r.jangadaSerial.toString().trim()
      const jangadaId = map.get(serial)
      if (jangadaId) {
        try {
          await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: jangadaId, jangadaSerial: serial } })
          result.inspecoes.updated++
        } catch (e) {
          console.error('Failed update inspecao id', r.id, e)
        }
      } else {
        result.skipped++
      }
    }
  } else {
    console.log('No inspecoes backup found to re-associate')
  }

  const outFile = path.join(logs, `reassociate_jangadas_${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), result }, null, 2))
  console.log('Re-association complete. Audit written to', outFile)

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error('Fatal:', e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
