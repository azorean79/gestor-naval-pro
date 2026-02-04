import { prisma } from './src/lib/prisma'

async function insertTiposPack() {
  try {
    console.log('Inserindo tipos de pack...')

    const result = await prisma.$executeRaw`
      INSERT INTO "public"."tipos_pack" ("nome", "id", "updatedAt", "descricao") VALUES
      ('SOLAS A', '1', '1970-01-01 00:00:00.000', 'Pack Solas A'),
      ('SOLAS B', '2', '1970-01-01 00:00:00.000', 'Pack Solas B')
    `

    console.log('Tipos de pack inseridos com sucesso:', result)
  } catch (error) {
    console.error('Erro ao inserir tipos de pack:', error)
  } finally {
    await prisma.$disconnect()
  }
}

insertTiposPack()