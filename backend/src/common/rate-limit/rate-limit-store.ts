import { Redis } from '@upstash/redis'

export type RateLimitDecision = {
  allowed: boolean
  retryAfterSeconds?: number
}

export type RateLimitStore = {
  kind: 'memory' | 'upstash'
  increment: (key: string, windowMs: number, maxRequests: number) => Promise<RateLimitDecision>
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}, 60_000).unref()

export function createMemoryRateLimitStore(): RateLimitStore {
  return {
    kind: 'memory',
    async increment(key, windowMs, maxRequests) {
      const now = Date.now()
      const existing = buckets.get(key)

      if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true }
      }

      if (existing.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        }
      }

      existing.count += 1
      return { allowed: true }
    },
  }
}

export function createUpstashRateLimitStore(config: { url: string; token: string }): RateLimitStore {
  const redis = new Redis({
    url: config.url,
    token: config.token,
  })

  return {
    kind: 'upstash',
    async increment(key, windowMs, maxRequests) {
      const currentCount = Number(await redis.incr(key))

      if (currentCount === 1) {
        await redis.pexpire(key, windowMs)
      }

      let ttlMs = Number(await redis.pttl(key))
      if (!Number.isFinite(ttlMs) || ttlMs < 0) {
        await redis.pexpire(key, windowMs)
        ttlMs = windowMs
      }

      if (currentCount > maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
        }
      }

      return { allowed: true }
    },
  }
}