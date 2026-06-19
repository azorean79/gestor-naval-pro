import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizeSerial(s?: string) {
  return (s || '').toString().trim().toLowerCase()
}

async function main() {
  const outDir = path.join(process.cwd(), 'prisma', 'logs')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  console.log('Analyzing jangadas for missing fields...')

  const totalRes: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada"`
  const total = Number(totalRes[0]?.n || 0)

  // many important fields are non-nullable in schema; check for empty strings or zero-capacity
  const ms1: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "serial" = ''`
  const missingSerial = Number(ms1[0]?.n || 0)
  const ms2: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "brand" = ''`
  const missingBrand = Number(ms2[0]?.n || 0)
  const ms3: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "model" = ''`
  const missingModel = Number(ms3[0]?.n || 0)
  const ms4: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "capacity" IS NULL OR "capacity" = 0`
  const missingCapacity = Number(ms4[0]?.n || 0)
  const ms5: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "packType" = ''`
  const missingPackType = Number(ms5[0]?.n || 0)

  // count rows where core descriptive fields are all missing/empty
  const am: any = await prisma.$queryRaw`
    SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "brand" = '' AND "model" = '' AND ("capacity" IS NULL OR "capacity" = 0) AND "packType" = ''
  `
  const allMissing = Number(am[0]?.n || 0)

  const result = {
    generatedAt: new Date().toISOString(),
    total,
    missingSerial,
    missingBrand,
    missingModel,
    missingCapacity,
    missingPackType,
    allMissing,
  }

  const outFile = path.join(outDir, `analyze_jangadas_${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2))
  console.log(`Analysis written to ${outFile}`)

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
