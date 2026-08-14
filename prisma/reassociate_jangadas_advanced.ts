import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalize(s?: string) {
  if (!s) return ''
  return s.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function digits(s?: string) {
  if (!s) return ''
  const m = s.match(/(\d{3,})/g)
  return m ? m.join('') : ''
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

  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true, owner: true, shipNameManual: true } })
  const exactMap = new Map<string, number>()
  const normMap = new Map<string, number[]>()
  const digitMap = new Map<string, number[]>()
  for (const j of jangadas) {
    const s = (j.serial || '').toString().trim()
    exactMap.set(s, j.id)
    const n = normalize(s)
    if (!normMap.has(n)) normMap.set(n, [])
    normMap.get(n)!.push(j.id)
    const d = digits(s)
    if (d) {
      if (!digitMap.has(d)) digitMap.set(d, [])
      digitMap.get(d)!.push(j.id)
    }
  }

  const audit: any = { certificados: { attempted: 0, updated: 0 }, inspecoes: { attempted: 0, updated: 0 }, details: [] }

  const certFile = latestFile(logs, /^backup_certificados_extraidos_.*\.json$/)
  if (!certFile) { console.log('No certificado backup found'); return }
  const certRaw = fs.readFileSync(certFile, 'utf8')
  const certs: any[] = JSON.parse(certRaw)

  for (const c of certs) {
    audit.certificados.attempted++
    const original = c.raftSerial
    if (!original) continue

    // 1) exact
    if (exactMap.has(original)) {
      try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: original } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'exact', serial: original}); continue } catch (e) {}
    }

    const n = normalize(original)
    // 2) normalized exact
    const nm = normMap.get(n) || []
    if (nm.length === 1) {
      const jid = nm[0]
      try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: original } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'norm1', serial: original}); continue } catch (e) {}
    }

    // 3) numeric substring match
    const d = digits(original)
    if (d && digitMap.has(d)) {
      const ids = digitMap.get(d) || []
      if (ids.length === 1) {
        try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: original } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'digits', serial: original}); continue } catch (e) {}
      }
    }

    // 4) match by shipName: compare certificado.shipName to jangada.owner or shipNameManual
    if (c.shipName) {
      const shipNorm = normalize(c.shipName)
      for (const j of jangadas) {
        const ownerNorm = normalize(j.owner || j.shipNameManual || '')
        if (ownerNorm && ownerNorm.includes(shipNorm)) {
          try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: j.serial } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'shipName', serial: j.serial}); break } catch (e) {}
        }
      }
    }

    // 5) suffix numeric match (last 6-8 chars)
    const suf = n.slice(-6)
    if (suf) {
      for (const [key] of exactMap) {
        if (normalize(key).endsWith(suf)) {
          try { await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: key } }); audit.certificados.updated++; audit.details.push({id:c.id, method:'suffix', serial: key}); break } catch (e) {}
        }
      }
    }
  }

  // Inspecoes
  const inspFile = latestFile(logs, /^backup_inspecoes_with_jangada_.*\.json$/)
  if (inspFile) {
    const inspRaw = fs.readFileSync(inspFile, 'utf8')
    const insps: any[] = JSON.parse(inspRaw)
    for (const r of insps) {
      audit.inspecoes.attempted++
      const original = r.jangadaSerial
      if (!original) continue
      if (exactMap.has(original)) {
        try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: exactMap.get(original), jangadaSerial: original } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'exact', serial: original}); continue } catch (e) {}
      }
      const n = normalize(original)
      const nm = normMap.get(n) || []
      if (nm.length === 1) {
        try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: nm[0], jangadaSerial: original } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'norm1', serial: original}); continue } catch (e) {}
      }
      const d = digits(original)
      if (d && digitMap.has(d) && digitMap.get(d)!.length === 1) {
        try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: digitMap.get(d)![0], jangadaSerial: original } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'digits', serial: original}); continue } catch (e) {}
      }
      // shipName heuristic
      if (r.navioNome) {
        const shipNorm = normalize(r.navioNome)
        for (const j of jangadas) {
          const ownerNorm = normalize(j.owner || j.shipNameManual || '')
          if (ownerNorm && ownerNorm.includes(shipNorm)) {
            try { await prisma.inspecao.update({ where: { id: r.id }, data: { jangadaId: j.id, jangadaSerial: j.serial } }); audit.inspecoes.updated++; audit.details.push({insp:r.id, method:'shipName', serial: j.serial}); break } catch (e) {}
          }
        }
      }
    }
  }

  const out = path.join(logs, `reassociate_jangadas_advanced_${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), audit }, null, 2))
  console.log('Done. Audit:', out)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error('Fatal:', e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
