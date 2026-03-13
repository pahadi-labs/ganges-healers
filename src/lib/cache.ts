/**
 * Simple in-memory cache with TTL.
 * Used for heavy read endpoints. Degrades gracefully — cache miss re-fetches.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 60_000 // 60 seconds

/** Get a cached value, or null if expired/missing. */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

/** Set a cache value with optional TTL (defaults to 60s). */
export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

/** Invalidate a specific cache key. */
export function cacheDelete(key: string): void {
  store.delete(key)
}

/** Invalidate all keys matching a prefix. */
export function cacheDeleteByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Cache-through helper: returns cached data if available,
 * otherwise calls fetcher, caches the result, and returns it.
 */
export async function cached<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
  const hit = cacheGet<T>(key)
  if (hit !== null) return hit
  const data = await fetcher()
  cacheSet(key, data, ttlMs)
  return data
}
