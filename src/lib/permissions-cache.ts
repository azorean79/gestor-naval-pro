import type { EffectiveUserPermissions } from "@/lib/user-permissions";

type CacheEntry = {
  value: EffectiveUserPermissions;
  expiresAt: number;
};

const TTL_MS = 60_000;
const globalStore = globalThis as typeof globalThis & {
  __userPermissionsCache?: Map<string, CacheEntry>;
};

const cache = globalStore.__userPermissionsCache ?? new Map<string, CacheEntry>();
if (!globalStore.__userPermissionsCache) {
  globalStore.__userPermissionsCache = cache;
}

function keyFor(userId: number | string, role: string) {
  return `${role}:${userId}`;
}

export function getCachedPermissions(userId: number | string, role: string) {
  const key = keyFor(userId, role);
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedPermissions(
  userId: number | string,
  role: string,
  value: EffectiveUserPermissions,
  ttlMs = TTL_MS
) {
  cache.set(keyFor(userId, role), { value, expiresAt: Date.now() + ttlMs });
}

export function invalidatePermissionsCache(userId?: number | string) {
  if (userId == null) {
    cache.clear();
    return;
  }
  const prefix = `:${userId}`;
  for (const key of cache.keys()) {
    if (key.endsWith(prefix) || key.includes(`:${userId}`)) cache.delete(key);
  }
}
