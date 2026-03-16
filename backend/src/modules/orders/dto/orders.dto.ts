import { z } from 'zod'

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
