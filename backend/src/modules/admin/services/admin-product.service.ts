import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error.js'
import { escapeRegex } from '../../../common/utils/regex.js'
import { cloudinary, isCloudinaryConfigured } from '../../../config/cloudinary.js'
import { env } from '../../../config/env.js'
import { logger } from '../../../config/logger.js'
import { ProductModel } from '../../products/schemas/product.schema.js'
import {
  createProductSchema,
  listAdminProductsQuerySchema,
  updateProductSchema,
} from '../dto/admin-products.dto.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export class AdminProductService {
  async listProducts(rawQuery: unknown) {
    const parsed = listAdminProductsQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      throw new HttpError(400, 'Parámetros no válidos para el listado de productos')
    }

    const { page, limit, q, includeInactive } = parsed.data
    const term = q?.trim()

    const query: Record<string, unknown> = {}
    if (!includeInactive) {
      query.isActive = true
    }

    if (term) {
      query.$or = [
        { name: { $regex: escapeRegex(term), $options: 'i' } },
        { slug: { $regex: escapeRegex(term), $options: 'i' } },
      ]
    }

    const [items, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query),
    ])

    return {
      items: items.map((product) => this.toAdminProductResponse(product)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async createProduct(rawBody: unknown) {
    const parsed = createProductSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, this.formatIssues(parsed.error.issues))
    }

    const existing = await ProductModel.findOne({ slug: parsed.data.slug })
      .select({ _id: 1 })
      .lean()
    if (existing) {
      throw new HttpError(409, `Ya existe un producto con el slug "${parsed.data.slug}"`)
    }

    const created = await ProductModel.create(parsed.data)
    logger.info({ productId: String(created._id), slug: created.slug }, 'Admin product created')

    return this.toAdminProductResponse(created.toObject())
  }

  async updateProduct(productId: string, rawBody: unknown) {
    this.assertValidId(productId)

    const parsed = updateProductSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, this.formatIssues(parsed.error.issues))
    }

    if (parsed.data.slug) {
      const clash = await ProductModel.findOne({
        slug: parsed.data.slug,
        _id: { $ne: new Types.ObjectId(productId) },
      })
        .select({ _id: 1 })
        .lean()

      if (clash) {
        throw new HttpError(409, `Ya existe otro producto con el slug "${parsed.data.slug}"`)
      }
    }

    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      { $set: parsed.data },
      { new: true, runValidators: true },
    ).lean()

    if (!updated) {
      throw new HttpError(404, 'Producto no encontrado')
    }

    logger.info({ productId, fields: Object.keys(parsed.data) }, 'Admin product updated')
    return this.toAdminProductResponse(updated)
  }

  async deactivateProduct(productId: string) {
    this.assertValidId(productId)

    const updated = await ProductModel.findByIdAndUpdate(
      productId,
      { $set: { isActive: false } },
      { new: true },
    ).lean()

    if (!updated) {
      throw new HttpError(404, 'Producto no encontrado')
    }

    logger.info({ productId }, 'Admin product deactivated')
    return this.toAdminProductResponse(updated)
  }

  async uploadImage(productId: string, file?: Express.Multer.File) {
    this.assertValidId(productId)

    if (!file) {
      throw new HttpError(400, 'No se ha recibido ninguna imagen')
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new HttpError(400, 'Formato no admitido. Usa JPEG, PNG o WebP.')
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new HttpError(400, 'La imagen supera el tamaño máximo de 5 MB')
    }

    if (!isCloudinaryConfigured) {
      throw new HttpError(
        503,
        'La subida de imágenes no está disponible: falta configurar Cloudinary.',
      )
    }

    const product = await ProductModel.findById(productId)
    if (!product) {
      throw new HttpError(404, 'Producto no encontrado')
    }

    const uploaded = await this.uploadToCloudinary(file.buffer, product.slug)

    product.images.push({
      url: uploaded.secure_url,
      alt: product.name,
      publicId: uploaded.public_id,
    })
    await product.save()

    logger.info({ productId, publicId: uploaded.public_id }, 'Admin product image uploaded')
    return this.toAdminProductResponse(product.toObject())
  }

  async deleteImage(productId: string, publicId: string) {
    this.assertValidId(productId)

    const product = await ProductModel.findById(productId)
    if (!product) {
      throw new HttpError(404, 'Producto no encontrado')
    }

    if (product.images.length <= 1) {
      throw new HttpError(409, 'El producto debe conservar al menos una imagen')
    }

    const index = product.images.findIndex((image) => image.publicId === publicId)
    if (index < 0) {
      throw new HttpError(404, 'Imagen no encontrada en el producto')
    }

    if (isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicId)
      } catch (error) {
        logger.warn(
          { productId, publicId, error: error instanceof Error ? error.message : 'desconocido' },
          'Cloudinary destroy failed, removing reference anyway',
        )
      }
    }

    product.images.splice(index, 1)
    await product.save()

    logger.info({ productId, publicId }, 'Admin product image deleted')
    return this.toAdminProductResponse(product.toObject())
  }

  private uploadToCloudinary(buffer: Buffer, slug: string) {
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/products`,
          public_id: `${slug}-${Date.now()}`,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(new HttpError(502, 'No pudimos subir la imagen a Cloudinary'))
            return
          }

          resolve({ secure_url: result.secure_url, public_id: result.public_id })
        },
      )

      stream.end(buffer)
    })
  }

  private assertValidId(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, 'Identificador de producto no válido')
    }
  }

  private formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
    return issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  }

  private toAdminProductResponse(product: {
    _id: unknown
    slug: string
    name: string
    description: string
    price: number
    currency: string
    category: string
    careLevel: string
    lightLevel: string
    size: string
    petFriendly: boolean
    isFeatured: boolean
    stock: number
    isActive: boolean
    images: Array<{ url: string; alt: string; publicId?: string | null }>
    tags: string[]
    createdAt?: Date
    updatedAt?: Date
  }) {
    return {
      id: String(product._id),
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      category: product.category,
      careLevel: product.careLevel,
      lightLevel: product.lightLevel,
      size: product.size,
      petFriendly: product.petFriendly,
      isFeatured: product.isFeatured,
      stock: product.stock,
      isActive: product.isActive,
      images: product.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        publicId: image.publicId ?? undefined,
      })),
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }
}
