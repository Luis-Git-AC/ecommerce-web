import { z } from 'zod'

const toBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const lowered = value.toLowerCase()
    if (lowered === 'true') {
      return true
    }
    if (lowered === 'false') {
      return false
    }
  }

  return undefined
}, z.boolean().optional())

const toStringList = z.preprocess(
  (value) => {
    const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []

    const normalized = raw
      .filter((item): item is string => typeof item === 'string')
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined
  },
  z.array(z.string().min(1).max(60)).max(20).optional(),
)

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: toStringList,
  careLevel: toStringList,
  lightLevel: toStringList,
  size: toStringList,
  petFriendly: toBoolean,
  q: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(['featured', 'price_asc', 'price_desc']).default('featured'),
})

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>
