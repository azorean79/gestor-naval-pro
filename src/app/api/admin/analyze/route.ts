import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST() {
  const totalRes: any = await prisma.$queryRaw`SELECT COUNT(*)::text AS n FROM "Jangada"`
  const total = Number(totalRes[0]?.n || 0)

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

  const am: any = await prisma.$queryRaw`
    SELECT COUNT(*)::text AS n FROM "Jangada" WHERE "brand" = '' AND "model" = '' AND ("capacity" IS NULL OR "capacity" = 0) AND "packType" = ''
  `
  const allMissing = Number(am[0]?.n || 0)

  const result = { generatedAt: new Date().toISOString(), total, missingSerial, missingBrand, missingModel, missingCapacity, missingPackType, allMissing }

  await prisma.$disconnect()
  return NextResponse.json({ ok: true, persisted: false, result })
}
