import { PrismaClient } from "@prisma/client";
import { resolveRuntimeDatabaseUrl } from "@/lib/resolve-database-url";

if (process.env.NODE_ENV === "production" && !process.env.PRISMA_DISABLE_WARNINGS) {
  process.env.PRISMA_DISABLE_WARNINGS = "1";
}

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  prismaConnectPromise?: Promise<void>;
};
const globalForPrisma = globalThis as GlobalWithPrisma;

const { connectionString: resolvedUrl } = resolveRuntimeDatabaseUrl();
const activeUrl = resolvedUrl || process.env.DATABASE_URL || "";
const isSQLite = activeUrl.startsWith("file:");

function stripInsensitiveMode(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripInsensitiveMode);
  }
  if (obj instanceof Date) {
    return obj;
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (key === "mode" && (obj[key] === "insensitive" || obj[key] === "default")) {
      continue;
    }
    cleaned[key] = stripInsensitiveMode(obj[key]);
  }
  return cleaned;
}

function wrapWithSQLiteProxy(rawClient: PrismaClient): PrismaClient {
  return new Proxy(rawClient as object, {
    get(target: any, prop: string | symbol) {
      const origValue = target[prop];
      if (origValue === null || origValue === undefined) {
        return origValue;
      }

      // Interceptar os delegados dos modelos (como prisma.navio, prisma.inspecao, etc.)
      if (typeof origValue === "object" && typeof prop === "string" && !prop.startsWith("$")) {
        return new Proxy(origValue, {
          get(modelTarget: any, modelProp: string | symbol) {
            const origMethod = modelTarget[modelProp];
            if (typeof origMethod === "function") {
              return function (...args: any[]) {
                const cleanedArgs = args.map(stripInsensitiveMode);
                return origMethod.apply(modelTarget, cleanedArgs);
              };
            }
            return origMethod;
          },
        });
      }

      if (typeof origValue === "function") {
        return origValue.bind(target);
      }

      return origValue;
    },
  }) as unknown as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["error"],
    datasources: {
      db: {
        url: activeUrl,
      },
    },
  }) as unknown as PrismaClient;
}

function getPrismaSingleton(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const rawClient = createPrismaClient();
  const client = isSQLite ? wrapWithSQLiteProxy(rawClient) : rawClient;
  globalForPrisma.prisma = client;

  // Ligação eager em background. Em caso de falha, limpa o singleton para
  // permitir nova tentativa na proxima importacao.
  globalForPrisma.prismaConnectPromise = rawClient
    .$connect()
    .then(async () => {
      if (isSQLite) {
        try {
          await rawClient.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
          await rawClient.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
        } catch {}
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[Prisma] Ligacao estabelecida (WAL Mode active).");
      }
    })
    .catch((err) => {
      console.error("[Prisma] Falha ao ligar:", err);
      globalForPrisma.prisma = undefined;
      globalForPrisma.prismaConnectPromise = undefined;
      throw err;
    });

  return client;
}

// Singleton global para evitar múltiplos motores Prisma no Next.js
const prisma = getPrismaSingleton();

export async function ensurePrismaConnected(): Promise<PrismaClient> {
  if (globalForPrisma.prismaConnectPromise) {
    await globalForPrisma.prismaConnectPromise;
  } else if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$connect();
  }
  return globalForPrisma.prisma ?? prisma;
}

export default prisma;
