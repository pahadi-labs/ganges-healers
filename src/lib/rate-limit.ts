/**
 * In-memory sliding-window rate limiter.
 * 100 requests / minute per IP. Works in both serverless and custom server.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 100

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL = 5 * 60_000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, CLEANUP_INTERVAL)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  let entry = store.get(ip)

  if (!entry) {
    entry = { timestamps: [] }
    store.set(ip, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS)

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.timestamps.push(now)
  const remaining = MAX_REQUESTS - entry.timestamps.length
  return { allowed: true, remaining }
}
