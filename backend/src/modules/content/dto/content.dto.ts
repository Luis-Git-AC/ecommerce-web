import { z } from 'zod'

export const blogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(6),
  category: z.string().trim().min(1).optional(),
})

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(8).max(2000),
})

export const subscribeNewsletterSchema = z.object({
  email: z.string().trim().email().max(200),
})

export const createClubLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  plan: z.enum(['basic', 'medio', 'premium']),
})

export type BlogListQuery = z.infer<typeof blogListQuerySchema>
