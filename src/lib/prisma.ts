import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Determine which database URL to use
const databaseUrl = process.env.DATABASE_URL || '';
const prismaAccelerateUrl = process.env.PRISMA_DATABASE_URL || '';

console.log('[Prisma] DATABASE_URL exists:', !!databaseUrl);
console.log('[Prisma] PRISMA_DATABASE_URL exists:', !!prismaAccelerateUrl);

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

// Setup adapter based on available configuration
if (prismaAccelerateUrl && prismaAccelerateUrl.startsWith('prisma+postgres://')) {
  // Use Prisma Accelerate
  console.log('[Prisma] Using Prisma Accelerate');
  prismaConfig.accelerateUrl = prismaAccelerateUrl;
} else if (databaseUrl && databaseUrl.startsWith('postgres')) {
  // Use direct PostgreSQL connection with adapter
  console.log('[Prisma] Using direct PostgreSQL adapter');
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  prismaConfig.adapter = new PrismaPg(pool);
} else {
  console.error('[Prisma] DATABASE_URL:', databaseUrl?.substring(0, 50));
  console.error('[Prisma] PRISMA_DATABASE_URL:', prismaAccelerateUrl?.substring(0, 50));
  throw new Error('DATABASE_URL or PRISMA_DATABASE_URL must be set and valid');
}

const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate())

export { prisma }