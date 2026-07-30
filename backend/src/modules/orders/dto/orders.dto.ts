import { z } from 'zod'

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  province: z.string().trim().min(2).max(80),
  country: z.string().trim().length(2).default('ES'),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s.-]{9,20}$/, 'Teléfono no válido'),
})

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
})

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  includePending: z.coerce.boolean().default(false),
})

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
