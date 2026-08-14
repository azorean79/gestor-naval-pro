import { PrismaClient } from '@prisma/client';

type FindFirstDelegate = {
  findFirst: (args: unknown) => Promise<unknown>;
};

/**
 * Executes a Prisma findFirst operation safely, catching any errors.
 * Returns the result or null if an error occurs.
 */
export async function safeFindFirst<T>(client: PrismaClient, model: keyof PrismaClient, args: unknown): Promise<T | null> {
  try {
    const delegate = client[model] as unknown as FindFirstDelegate;
    const result = await delegate.findFirst(args);
    return result as T;
  } catch (error) {
    console.error('safeFindFirst error:', error);
    return null;
  }
}
