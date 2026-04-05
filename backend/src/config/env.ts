import 'dotenv/config'
import { z } from 'zod'

const isLocalHostname = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1'

const validateOrigin = (origin: string) => {
  const parsed = new URL(origin)

  if (parsed.protocol !== 'https:') {
    throw new Error(`CORS origin must use https in production: ${origin}`)
  }

  if (isLocalHostname(parsed.hostname)) {
    throw new Error(`CORS origin cannot point to localhost in production: ${origin}`)
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_STORE: z.enum(['memory', 'upstash']).default('memory'),
  RATE_LIMIT_PREFIX: z.string().trim().min(1).default('ecommerce-web'),
  UPSTASH_REDIS_REST_URL: z.string().trim().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().optional(),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('ecommerce-web'),
  JWT_ACCESS_SECRET: z.string().min(16).optional(),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')

  throw new Error(`Invalid environment variables: ${errors}`)
}

const requiredInProduction = [
  'MONGODB_URI',
  'MONGODB_DB_NAME',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

const productionErrors: string[] = []

if (parsed.data.NODE_ENV === 'production') {
  for (const key of requiredInProduction) {
    const value = parsed.data[key]
    if (typeof value !== 'string' || value.trim().length === 0) {
      productionErrors.push(`${key} is required in production`)
    }
  }

  if (parsed.data.CORS_ORIGIN.trim() === '*') {
    productionErrors.push('CORS_ORIGIN cannot be * in production')
  } else {
    const origins = parsed.data.CORS_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)

    if (origins.length === 0) {
      productionErrors.push('CORS_ORIGIN must define at least one origin in production')
    }

    for (const origin of origins) {
      try {
        validateOrigin(origin)
      } catch (error) {
        productionErrors.push(error instanceof Error ? error.message : `Invalid CORS_ORIGIN: ${origin}`)
      }
    }
  }

  if (parsed.data.STRIPE_SECRET_KEY && !parsed.data.STRIPE_SECRET_KEY.startsWith('sk_')) {
    productionErrors.push('STRIPE_SECRET_KEY must start with sk_')
  }

  if (parsed.data.STRIPE_WEBHOOK_SECRET && !parsed.data.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    productionErrors.push('STRIPE_WEBHOOK_SECRET must start with whsec_')
  }

  if (parsed.data.RATE_LIMIT_STORE === 'upstash') {
    if (!parsed.data.UPSTASH_REDIS_REST_URL) {
      productionErrors.push('UPSTASH_REDIS_REST_URL is required when RATE_LIMIT_STORE=upstash')
    }

    if (!parsed.data.UPSTASH_REDIS_REST_TOKEN) {
      productionErrors.push('UPSTASH_REDIS_REST_TOKEN is required when RATE_LIMIT_STORE=upstash')
    }
  }
}

if (productionErrors.length > 0) {
  throw new Error(`Invalid environment variables: ${productionErrors.join('; ')}`)
}

export const env = {
  ...parsed.data,
  JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_this',
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_this',
}
