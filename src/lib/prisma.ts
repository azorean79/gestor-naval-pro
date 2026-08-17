import { PrismaClient } from "@prisma/client";
import { resolveRuntimeDatabaseUrl } from "@/lib/resolve-database-url";
import {
  syncClienteNumeroFromExterno,
  extractNumeroClienteExterno,
} from "@/lib/sync-cliente-numero";

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

function attachClienteNumeroSync(rawClient: PrismaClient): PrismaClient {
  async function afterWrite(row: any, dataClienteId?: any): Promise<any> {
    try {
      if (row && typeof row === "object") {
        const externo = extractNumeroClienteExterno(row["metadados"]);
        const clienteId = row["clienteId"] ?? dataClienteId;
        if (externo && clienteId) {
          await syncClienteNumeroFromExterno(rawClient, clienteId, externo);
        }
      }
    } catch {
      // não deve interromper a escrita principal
    }
    return row;
  }

  const extended = rawClient.$extends({
    query: {
      ordemServico: {
        async create({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
        async update({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
        async upsert({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
      },
      fatura: {
        async create({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
        async update({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
        async upsert({ args, query }: any) {
          return afterWrite(await query(args), args?.data?.clienteId);
        },
      },
    },
  });
  return extended as unknown as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["error"],
    datasources: {
      db: {
        url: activeUrl,
      },
    },
  }) as unknown as PrismaClient;
  return attachClienteNumeroSync(client);
}

function getPrismaSingleton(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const rawClient = createPrismaClient();
  const client = isSQLite ? wrapWithSQLiteProxy(rawClient) : rawClient;
  globalForPrisma.prisma = client;
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
