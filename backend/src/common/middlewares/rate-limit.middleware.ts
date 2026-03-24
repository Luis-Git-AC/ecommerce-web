import type { NextFunction, Request, Response } from 'express'

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
  keyPrefix: string
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

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix } = options

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for']
    const forwardedIp = typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : undefined

    const ip = forwardedIp || req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()
    const existing = buckets.get(key)

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSeconds)))
      res.status(429).json({
        message: 'Too many requests. Try again later.',
      })
      return
    }

    existing.count += 1
    next()
  }
}
