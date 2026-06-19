import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizeSerial(s?: string) {
  return (s || '').toString().trim().toLowerCase()
}

function countNonEmpty(obj: Record<string, any>) {
  return Object.values(obj).reduce((acc, v) => acc + (v === null || v === undefined || v === '' ? 0 : 1), 0)
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const outDir = path.join(process.cwd(), 'prisma', 'logs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  console.log('Loading jangadas from database...')
  // fetch all fields to avoid mismatches with schema select typings
  const jangadas = await prisma.jangada.findMany()

  const bySerial = new Map<string, Array<any>>()
  for (const j of jangadas) {
    const key = normalizeSerial(j.serial)
    if (!key) continue
    if (!bySerial.has(key)) bySerial.set(key, [])
    bySerial.get(key)!.push(j)
  }

  const duplicateGroups: Array<any> = []
  for (const [serial, group] of bySerial.entries()) {
    if (group.length <= 1) continue
    // choose canonical by score: more non-empty fields and latest updatedAt
    const scored = group.map(g => ({
      item: g,
      score: countNonEmpty({ marca: g.marca, modelo: g.modelo, lotacao: g.lotacao, tipoPack: g.tipoPack }) + (Array.isArray(g.artigos) ? g.artigos.length : 0),
    }))
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime()
    })
    const canonical = scored[0].item
    const others = group.filter(g => g.id !== canonical.id)

    // build merged data preferring canonical but filling from others
    const merged: any = {
      marca: canonical.marca || null,
      modelo: canonical.modelo || null,
      lotacao: canonical.lotacao || null,
      tipoPack: canonical.tipoPack || null,
      artigos: Array.isArray(canonical.artigos) ? [...canonical.artigos] : [],
    }
    for (const o of others) {
      if (!merged.marca && o.marca) merged.marca = o.marca
      if (!merged.modelo && o.modelo) merged.modelo = o.modelo
      if (!merged.lotacao && o.lotacao) merged.lotacao = o.lotacao
      if (!merged.tipoPack && o.tipoPack) merged.tipoPack = o.tipoPack
      if (Array.isArray(o.artigos)) {
        for (const a of o.artigos) {
          const exists = merged.artigos.find((x: any) => JSON.stringify(x) === JSON.stringify(a))
          if (!exists) merged.artigos.push(a)
        }
      }
    }

    duplicateGroups.push({ serial, canonicalId: canonical.id, canonical, others, merged })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dryRunFile = path.join(outDir, `merge_jangadas_dryrun_${timestamp}.json`)
  fs.writeFileSync(dryRunFile, JSON.stringify({ generatedAt: new Date().toISOString(), groups: duplicateGroups }, null, 2))
  console.log(`Dry-run written to ${dryRunFile}. Groups: ${duplicateGroups.length}`)

  if (!apply) {
    console.log('Dry-run complete. No changes applied. To perform the merge run with:')
    console.log('  npx ts-node prisma/merge_jangadas.ts --apply')
    await prisma.$disconnect()
    return
  }

  // Create backup of jangadas before applying
  const backupFile = path.join(outDir, `jangadas_backup_before_merge_${timestamp}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(jangadas, null, 2))
  console.log(`Backup of jangadas written to ${backupFile}`)

  console.log('Applying merges in a transaction...')
  const audit: any[] = []

  try {
    await prisma.$transaction(async (tx) => {
      for (const g of duplicateGroups) {
        const { canonicalId, others, merged, serial } = g
        const otherIds = others.map((o: any) => o.id)

        // Update related tables that reference jangadaId — best-effort with try/catch
        const relatedUpdates: any = {}
        const relatedModels = [
          'certificadoExtraido',
          'certificadoValidade',
          'inspecao',
        ]
        for (const modelName of relatedModels) {
          try {
            // @ts-ignore
            const res = await tx[modelName].updateMany({ where: { jangadaId: { in: otherIds } }, data: { jangadaId: canonicalId } })
            relatedUpdates[modelName] = { updated: res.count }
          } catch (e) {
            relatedUpdates[modelName] = { error: String(e) }
          }
        }

        // Update canonical with merged data
        const updateData: any = {}
        if (merged.marca) updateData.marca = merged.marca
        if (merged.modelo) updateData.modelo = merged.modelo
        if (merged.lotacao) updateData.lotacao = merged.lotacao
        if (merged.tipoPack) updateData.tipoPack = merged.tipoPack
        if (Array.isArray(merged.artigos)) updateData.artigos = merged.artigos

        try {
          await tx.jangada.update({ where: { id: canonicalId }, data: updateData })
        } catch (e) {
          // record error but continue
          relatedUpdates['updateCanonicalError'] = String(e)
        }

        // Delete other duplicates
        try {
          await tx.jangada.deleteMany({ where: { id: { in: otherIds } } })
          relatedUpdates['deletedDuplicates'] = otherIds.length
        } catch (e) {
          relatedUpdates['deleteError'] = String(e)
        }

        audit.push({ serial, canonicalId, otherIds, relatedUpdates })
      }
    })

    const auditFile = path.join(outDir, `merge_jangadas_audit_${timestamp}.json`)
    fs.writeFileSync(auditFile, JSON.stringify({ performedAt: new Date().toISOString(), audit }, null, 2))
    console.log(`Merge applied. Audit written to ${auditFile}`)
  } catch (err) {
    console.error('Transaction failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(async (e) => {
  console.error('Fatal error:', e)
  try { await prisma.$disconnect() } catch { }
  process.exit(1)
})
