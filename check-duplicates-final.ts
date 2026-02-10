import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Determine which database URL to use
const databaseUrl = process.env.DATABASE_URL || '';
const prismaAccelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || '';

console.log('[Prisma] DATABASE_URL exists:', !!databaseUrl);
console.log('[Prisma] PRISMA_DATABASE_URL exists:', !!prismaAccelerateUrl);

const prismaConfig: any = {
  log: ['error', 'warn'],
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

const prisma = new PrismaClient(prismaConfig)

async function checkDuplicates() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Verificar duplicatas de números de série
    const duplicates = await prisma.$queryRaw`
      SELECT "numeroSerie", COUNT(*) as count
      FROM jangadas
      GROUP BY "numeroSerie"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    console.log('\n🔍 Verificação de números de série duplicados:');
    console.log('=====================================');

    if ((duplicates as any[]).length === 0) {
      console.log('✅ Nenhum número de série duplicado encontrado.');
    } else {
      console.log('⚠️  Números de série duplicados encontrados:');
      console.log('');

      (duplicates as any[]).forEach((dup: any) => {
        console.log(`📋 Número de série: ${dup.numeroSerie}`);
        console.log(`   Quantidade: ${dup.count}`);
        console.log('   ---');
      });

      console.log(`\n📊 Total de números de série duplicados: ${(duplicates as any[]).length}`);
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Erro ao verificar duplicatas:', error.message);
    process.exit(1);
  }
}

checkDuplicates();