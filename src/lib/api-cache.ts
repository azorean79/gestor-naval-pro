type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __apiResponseCache?: Map<string, CacheEntry>;
};

const store = globalStore.__apiResponseCache ?? new Map<string, CacheEntry>();
if (!globalStore.__apiResponseCache) {
  globalStore.__apiResponseCache = store;
}

function cleanup(now = Date.now()) {
  if (store.size < 200) return;
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { value, expiresAt: now + Math.max(1, ttlSeconds) * 1000 });
  cleanup(now);
  return value;
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
