import { z } from 'zod'

export const createPaymentIntentSchema = z.object({
  orderId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
})
