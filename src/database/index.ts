// Resolve DB URL preference: prefer Supabase/DATABASE_URL, then gestornavalpro_* fallbacks
// This makes deployments to Vercel/Supabase straightforward (set DATABASE_URL or SUPABASE_DATABASE_URL)
const resolvedDbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.gestornavalpro_DATABASE_URL || process.env.gestornavalpro_POSTGRES_URL;
const isAccelerate = typeof resolvedDbUrl === 'string' && resolvedDbUrl.startsWith('prisma+');

function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Log the effective DATABASE_URL type in development to help debug
if (process.env.NODE_ENV !== 'production') {
  const type = resolvedDbUrl ? (isAccelerate ? 'prisma+' : resolvedDbUrl.split(':')[0]) : 'undefined';
  // Determine which env provided the resolved URL for clearer diagnostics
  const source = process.env.SUPABASE_DATABASE_URL ? 'SUPABASE_DATABASE_URL' : (resolvedDbUrl === process.env.DATABASE_URL ? 'DATABASE_URL' : 'gestornavalpro_*');
  console.log('[db] Effective DATABASE_URL type:', type, ' (source:', source, ')');
}

// Defer requiring Prisma until after we inspect env
const { PrismaClient } = require('@prisma/client');
// Adapter helper for Postgres-backed generated clients
let PrismaPg: any = null;
try {
  PrismaPg = require('@prisma/adapter-pg').PrismaPg;
} catch (e) {
  // adapter-pg may not be installed in some environments; we'll fall back to accelerateUrl only
  PrismaPg = null;
}

// Build Prisma client options; include accelerateUrl when using Prisma Accelerate
const clientOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};
if (isAccelerate) {
  clientOptions.accelerateUrl = resolvedDbUrl;
  if (process.env.NODE_ENV !== 'production') console.log('[db] Using Prisma Accelerate (accelerateUrl)');
} else if (PrismaPg && resolvedDbUrl) {
  // If the generated client expects an adapter, provide a PrismaPg adapter using the resolved DB URL
  try {
    clientOptions.adapter = new PrismaPg({ connectionString: resolvedDbUrl });
    if (process.env.NODE_ENV !== 'production') console.log('[db] Using PrismaPg adapter with resolved DB URL');
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[db] Failed to construct PrismaPg adapter:', errorToString(e));
  }
}

// If we couldn't construct an adapter and we're not using accelerate explicitly,
// fall back to using the `DATABASE_URL` accelerate URL when available. This
// prevents PrismaClient constructor validation errors in mixed env setups.
if (!clientOptions.adapter && !clientOptions.accelerateUrl) {
  const fallbackAccel = process.env.DATABASE_URL;
  if (fallbackAccel && typeof fallbackAccel === 'string' && fallbackAccel.startsWith('prisma+')) {
    clientOptions.accelerateUrl = fallbackAccel;
    if (process.env.NODE_ENV !== 'production') console.log('[db] Falling back to DATABASE_URL as accelerateUrl');
  } else {
    if (process.env.NODE_ENV !== 'production') console.warn('[db] No Prisma adapter or accelerateUrl available; PrismaClient may require one.');
  }
}

// Use a plain JS global to cache the client across hot reloads
const g: any = (globalThis as any) || (global as any) || {};
let prisma: any;
try {
  if (g.__prisma) {
    prisma = g.__prisma;
  } else {
    prisma = new PrismaClient(clientOptions);
    if (process.env.NODE_ENV !== 'production') g.__prisma = prisma;
  }
  // Development-time diagnostics: mask long URLs when logging
  if (process.env.NODE_ENV !== 'production') {
    const masked = resolvedDbUrl && resolvedDbUrl.length > 40 ? resolvedDbUrl.slice(0, 20) + '...' : resolvedDbUrl;
    console.log('[db] Prisma client instantiated. resolvedDbUrl(masked)=', masked);
    try {
      console.log('[db] Prisma exported keys:', Object.keys(prisma || {}));
      console.log('[db] Has model delegates:', ['navio','jangada'].map(k => `${k}=${typeof prisma?.[k]}`));
    } catch (e) {
      console.warn('[db] Failed to inspect prisma object:', errorToString(e));
    }
  }
} catch (e) {
  console.error('[db] Prisma client instantiation error:', errorToString(e));
  throw e;
}

module.exports = prisma;
export default prisma;
