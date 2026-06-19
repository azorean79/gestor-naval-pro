import { PrismaClient } from '@prisma/client';
import { resolveRuntimeDatabaseUrl } from '@/lib/resolve-database-url';

if (process.env.NODE_ENV === 'production' && !process.env.PRISMA_DISABLE_WARNINGS) {
	process.env.PRISMA_DISABLE_WARNINGS = '1';
}

// Prevent multiple instances of PrismaClient in development
type GlobalWithPrisma = typeof globalThis & { prisma?: PrismaClient };
const globalForPrisma = globalThis as GlobalWithPrisma;

const { connectionString } = resolveRuntimeDatabaseUrl();

if (connectionString && !process.env.DATABASE_URL) {
	process.env.DATABASE_URL = connectionString;
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
