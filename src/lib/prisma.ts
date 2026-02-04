import { PrismaClient } from '../../prisma/app/generated-prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Check if we're using Prisma Accelerate URL or direct connection
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';
const isDatabaseUrlAccelerate = databaseUrl.startsWith('prisma+postgres://');

const prismaConfig: any = {
  log: ['error', 'warn'],
  omit: {
    navio: {
      createdAt: true,
      updatedAt: true,
    },
    jangada: {
      createdAt: true,
      updatedAt: true,
    },
    cliente: {
      createdAt: true,
      updatedAt: true,
    },
    inspecao: {
      createdAt: true,
      updatedAt: true,
    },
    cilindro: {
      createdAt: true,
      updatedAt: true,
    },
    fatura: {
      createdAt: true,
      updatedAt: true,
    },
    agendamento: {
      createdAt: true,
      updatedAt: true,
    },
    obra: {
      createdAt: true,
      updatedAt: true,
    },
    proprietario: {
      createdAt: true,
      updatedAt: true,
    },
    marcaJangada: {
      createdAt: true,
      updatedAt: true,
    },
    modeloJangada: {
      createdAt: true,
      updatedAt: true,
    },
    lotacaoJangada: {
      createdAt: true,
      updatedAt: true,
    },
    sistemaCilindro: {
      createdAt: true,
      updatedAt: true,
    },
    tipoValvula: {
      createdAt: true,
      updatedAt: true,
    },
    custoInspecao: {
      createdAt: true,
      updatedAt: true,
    },
    notificacao: {
      createdAt: true,
      updatedAt: true,
    },
  },
};

// Add accelerateUrl only if using Prisma Accelerate
if (isDatabaseUrlAccelerate) {
  prismaConfig.accelerateUrl = databaseUrl;
}

const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

export { prisma }