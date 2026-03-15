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

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().trim().min(1).optional(),
  careLevel: z.string().trim().min(1).optional(),
  lightLevel: z.string().trim().min(1).optional(),
  size: z.string().trim().min(1).optional(),
  petFriendly: toBoolean,
  sort: z.enum(['featured', 'price_asc', 'price_desc']).default('featured'),
})

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>
