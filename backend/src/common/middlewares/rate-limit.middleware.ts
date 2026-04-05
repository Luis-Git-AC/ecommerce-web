import type { NextFunction, Request, Response } from 'express'
import { env } from '../../config/env'
import { logger } from '../../config/logger'
import { createMemoryRateLimitStore, createUpstashRateLimitStore, type RateLimitStore } from '../rate-limit/rate-limit-store'

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}

const memoryStore = createMemoryRateLimitStore()

const distributedStore: RateLimitStore =
  env.RATE_LIMIT_STORE === 'upstash' && env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? createUpstashRateLimitStore({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : memoryStore

let hasWarnedMemoryInProduction = false
let hasWarnedUpstashFallback = false

if (env.NODE_ENV === 'production' && env.RATE_LIMIT_STORE === 'memory' && !hasWarnedMemoryInProduction) {
  logger.warn('Rate limiting is using in-memory storage in production. Configure RATE_LIMIT_STORE=upstash for distributed protection.')
  hasWarnedMemoryInProduction = true
}

if (env.RATE_LIMIT_STORE === 'upstash' && distributedStore.kind === 'memory' && !hasWarnedUpstashFallback) {
  logger.warn('RATE_LIMIT_STORE=upstash is configured without a valid Upstash URL/token. Falling back to in-memory rate limiting.')
  hasWarnedUpstashFallback = true
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix } = options

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for']
    const forwardedIp = typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : undefined

    const ip = forwardedIp || req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${env.RATE_LIMIT_PREFIX}:${keyPrefix}:${ip}`

    try {
      const decision = await distributedStore.increment(key, windowMs, maxRequests)

      if (decision.allowed) {
        next()
        return
      }

      res.setHeader('Retry-After', String(decision.retryAfterSeconds ?? 1))
      res.status(429).json({
        message: 'Too many requests. Try again later.',
      })
      return
    } catch (error) {
      if (distributedStore.kind === 'upstash') {
        if (!hasWarnedUpstashFallback) {
          logger.warn(
            {
              error: error instanceof Error ? error.message : 'unknown-error',
            },
            'Upstash rate limiting failed at runtime. Falling back to in-memory store.',
          )
          hasWarnedUpstashFallback = true
        }

        const decision = await memoryStore.increment(key, windowMs, maxRequests)
        if (decision.allowed) {
          next()
          return
        }

        res.setHeader('Retry-After', String(decision.retryAfterSeconds ?? 1))
        res.status(429).json({
          message: 'Too many requests. Try again later.',
        })
        return
      }

      next(error)
      return
    }
  }
}
