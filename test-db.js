import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Determine which database URL to use
const databaseUrl = process.env.DATABASE_URL || '';
const prismaAccelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';

console.log('[Test] DATABASE_URL exists:', !!databaseUrl);
console.log('[Test] PRISMA_DATABASE_URL exists:', !!prismaAccelerateUrl);

const prismaConfig = {
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
  },
};

// Setup adapter based on available configuration
if (prismaAccelerateUrl && prismaAccelerateUrl.startsWith('prisma+postgres://')) {
  // Use Prisma Accelerate
  console.log('[Test] Using Prisma Accelerate');
  prismaConfig.accelerateUrl = prismaAccelerateUrl;
} else if (databaseUrl && databaseUrl.startsWith('postgres')) {
  // Use direct PostgreSQL connection with adapter
  console.log('[Test] Using direct PostgreSQL adapter');
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  prismaConfig.adapter = new PrismaPg(pool);
} else {
  console.error('[Test] DATABASE_URL:', databaseUrl?.substring(0, 50));
  console.error('[Test] PRISMA_DATABASE_URL:', prismaAccelerateUrl?.substring(0, 50));
  throw new Error('DATABASE_URL or PRISMA_DATABASE_URL must be set and valid');
}

const prisma = new PrismaClient(prismaConfig).$extends(withAccelerate());

async function testConnection() {
  try {
    console.log('Testando conexão com o banco de dados...');

    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão bem-sucedida!', result);

    // Test counting records
    const clienteCount = await prisma.cliente.count();
    console.log(`📊 Clientes no banco: ${clienteCount}`);

    const jangadaCount = await prisma.jangada.count();
    console.log(`🚣 Jangadas no banco: ${jangadaCount}`);

    const navioCount = await prisma.navio.count();
    console.log(`🚢 Navios no banco: ${navioCount}`);

  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    console.error('Detalhes do erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();