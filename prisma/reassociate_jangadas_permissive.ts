import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalize(s?: string) {
  if (!s) return ''
  return s.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

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

  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true } })
  const exactMap = new Map<string, number>()
  const normMap = new Map<string, number[]>()
  for (const j of jangadas) {
    const s = (j.serial || '').toString().trim()
    exactMap.set(s, j.id)
    const n = normalize(s)
    if (!normMap.has(n)) normMap.set(n, [])
    normMap.get(n)!.push(j.id)
  }

  const audit: any = { certificados: { attempted: 0, updated: 0 }, inspecoes: { attempted: 0, updated: 0 }, details: [] }

  const certFile = latestFile(logs, /^backup_certificados_extraidos_.*\.json$/)
  if (certFile) {
    const raw = fs.readFileSync(certFile, 'utf8')
    let certs: any[] = []
    try { certs = JSON.parse(raw) } catch (e) { console.error('parse fail', e) }
    for (const c of certs) {
      audit.certificados.attempted++
      const original = c.raftSerial
      if (!original) continue
      // try exact
      const exact = exactMap.get(original)
      if (exact) {
        try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: original } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'exact', serial: original}); continue } catch (e) { }
      }
      const n = normalize(original)
      const ids = normMap.get(n) || []
      if (ids.length === 1) {
        try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: original } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'norm', serial: original}); continue } catch (e) { }
      }
      // suffix match: try last 8 chars
      const suf = n.slice(-8)
      if (suf) {
        for (const [key, val] of exactMap.entries()) {
          if (normalize(key).endsWith(suf)) {
            try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: key } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'suffix', serial: key}); break } catch (e) { }
          }
        }
      }
    }
  }

  const inspFile = latestFile(logs, /^backup_inspecoes_with_jangada_.*\.json$/)
  if (inspFile) {
    const raw = fs.readFileSync(inspFile, 'utf8')
    let insps: any[] = []
    try { insps = JSON.parse(raw) } catch (e) { console.error('parse fail', e) }
    for (const r of insps) {
      audit.inspecoes.attempted++
      const original = r.jangadaSerial
      if (!original) continue
      const exact = exactMap.get(original)
      if (exact) {
        try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: exact, jangadaSerial: original } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'exact', serial: original}); continue } catch (e) { }
      }
      const n = normalize(original)
      const ids = normMap.get(n) || []
      if (ids.length === 1) {
        try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: ids[0], jangadaSerial: original } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'norm', serial: original}); continue } catch (e) { }
      }
      const suf = n.slice(-8)
      if (suf) {
        for (const [key, val] of exactMap.entries()) {
          if (normalize(key).endsWith(suf)) {
            try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: val, jangadaSerial: key } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'suffix', serial: key}); break } catch (e) { }
          }
        }
      }
    }
  }

  const out = path.join(logs, `reassociate_jangadas_permissive_${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), audit }, null, 2))
  console.log('Done. Audit:', out)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error('Fatal:', e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
