import { z } from 'zod'
import { ORDER_STATUSES } from '../../orders/schemas/order.schema.js'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const productImageSchema = z.object({
  url: z.string().trim().url().max(500),
  alt: z.string().trim().min(2).max(160),
  publicId: z.string().trim().max(200).optional(),
})

export const createProductSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(slugPattern, 'El slug solo admite minúsculas, números y guiones'),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(2000),
  price: z.coerce.number().min(0).max(100000),
  currency: z.string().trim().length(3).default('EUR'),
  category: z.string().trim().min(2).max(60),
  careLevel: z.string().trim().min(2).max(60),
  lightLevel: z.string().trim().min(2).max(60),
  size: z.string().trim().min(1).max(10),
  petFriendly: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  stock: z.coerce.number().int().min(0).max(100000).default(0),
  isActive: z.coerce.boolean().default(true),
  images: z.array(productImageSchema).min(1, 'Se requiere al menos una imagen').max(10),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
})

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Indica al menos un campo a modificar',
  })

export const listAdminProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  includeInactive: z.coerce.boolean().default(true),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})

export const listContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
