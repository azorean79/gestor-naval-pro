import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing jangada references and deleting jangadas...')
  try {
    await prisma.$transaction(async (tx) => {
      // Nullify inspecao links to jangada
      console.log('Nullifying inspecoes.jangadaId and jangadaSerial where linked to jangadas...')
      await tx.$executeRaw`UPDATE "Inspecao" SET "jangadaId" = NULL, "jangadaSerial" = NULL WHERE "jangadaId" IS NOT NULL`

      // Nullify certificadoExtraido raftSerial where matching existing jangada serials
      console.log('Nullifying certificadoExtraido.raftSerial where not null...')
      await tx.$executeRaw`UPDATE "CertificadoExtraido" SET "raftSerial" = NULL WHERE "raftSerial" IS NOT NULL`

      // Delete all jangadas
      console.log('Deleting all jangadas...')
      await tx.jangada.deleteMany({})

    })
    console.log('Clear completed.')
  } catch (e) {
    console.error('Failed to clear jangadas:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(async (e) => { console.error(e); try { await prisma.$disconnect() } catch{}; process.exit(1) })
