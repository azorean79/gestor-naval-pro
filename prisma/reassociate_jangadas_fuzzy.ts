import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalize(s?: string) {
  if (!s) return ''
  return s.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function levenshtein(a: string, b: string) {
  const A = a || ''
  const B = b || ''
  const m = A.length
  const n = B.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
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

  const unmatchedFile = latestFile(logs, /^unmatched_certificados_.*\.json$/)
  if (!unmatchedFile) { console.error('No unmatched file found'); process.exit(1) }
  const unmatchedRaw = fs.readFileSync(unmatchedFile, 'utf8')
  const unmatchedDoc = JSON.parse(unmatchedRaw)
  const unmatched: any[] = unmatchedDoc.unmatched || []

  const jangadas = await prisma.jangada.findMany({ select: { id: true, serial: true, owner: true, shipNameManual: true } })

  const results: any[] = []
  let updated = 0

  for (const c of unmatched) {
    const original = c.raftSerial || ''
    const shipName = c.shipName || ''
    const nOriginal = normalize(original)
    let best: { id: number; serial: string; score: number; kind: string } | null = null

    for (const j of jangadas) {
      const jSerial = j.serial || ''
      const nJ = normalize(jSerial)
      const dist = levenshtein(nOriginal, nJ)
      const maxLen = Math.max(nOriginal.length, nJ.length, 1)
      const ratio = dist / maxLen
      // prefer low ratio (more similar)
      if (!best || ratio < best.score) {
        best = { id: j.id, serial: jSerial, score: ratio, kind: 'serial' }
      }
      // also try shipName similarity if serial empty
      if ((!original || original === '') && shipName) {
        const nShip = normalize(shipName)
        const jOwner = normalize(j.owner || j.shipNameManual || '')
        if (jOwner) {
          const d2 = levenshtein(nShip, jOwner)
          const r2 = d2 / Math.max(nShip.length, jOwner.length, 1)
          if (!best || r2 < best.score) best = { id: j.id, serial: jSerial, score: r2, kind: 'shipName' }
        }
      }
    }

    // accept if ratio <= 0.35 or small absolute distance
    if (best && (best.score <= 0.35)) {
      try {
        await prisma.certificadoExtraido.update({ where: { id: c.id }, data: { raftSerial: best.serial } })
        results.push({ id: c.id, matchedSerial: best.serial, score: best.score, kind: best.kind })
        updated++
      } catch (e) {
        results.push({ id: c.id, error: String(e) })
      }
    } else {
      results.push({ id: c.id, matchedSerial: best?.serial || null, score: best?.score ?? null, reason: 'no-good-match' })
    }
  }

  const out = path.join(logs, `reassociate_jangadas_fuzzy_${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), total: unmatched.length, updated, results }, null, 2))
  console.log('Fuzzy reassociation complete. Updated:', updated, 'Audit:', out)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error('Fatal:', e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
