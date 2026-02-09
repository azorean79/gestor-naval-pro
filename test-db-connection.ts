import { PrismaClient } from './prisma/app/generated-prisma-client';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test a simple query
    const count = await prisma.jangada.count();
    console.log(`📊 Found ${count} jangadas in database`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();