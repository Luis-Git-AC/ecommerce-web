import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { listProductsQuerySchema, type ListProductsQuery } from '../dto/list-products.query'
import { ProductRepository } from '../repositories/product.repository'
import { optimizeProductImages } from './product-image-delivery'

export class ProductService {
  constructor(private readonly productRepository: ProductRepository = new ProductRepository()) {}

  private normalizeImages(images: Array<{ url: string; alt: string; publicId?: string | null }>) {
    return images.map((image) => ({
      url: image.url,
      alt: image.alt,
      publicId: image.publicId ?? undefined,
    }))
  }

  async listProducts(rawQuery: unknown) {
    const parsedQuery = listProductsQuerySchema.safeParse(rawQuery)
    if (!parsedQuery.success) {
      throw new HttpError(400, 'Invalid query params for products listing')
    }

    const result = await this.productRepository.findAll(this.toRepositoryQuery(parsedQuery.data))

    return {
      ...result,
      items: result.items.map((product) => ({
        ...product,
        images: optimizeProductImages(this.normalizeImages(product.images), 'listing'),
      })),
    }
  }

  async getProductById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid product id')
    }

    const product = await this.productRepository.findById(id)
    if (!product) {
      throw new HttpError(404, 'Product not found')
    }

    return {
      ...product,
      images: optimizeProductImages(this.normalizeImages(product.images), 'detail'),
    }
  }

  async getFeaturedProducts() {
    const products = await this.productRepository.findFeatured()

    return products.map((product) => ({
      ...product,
      images: optimizeProductImages(this.normalizeImages(product.images), 'listing'),
    }))
  }

  async getRelatedProducts(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid product id')
    }

    const products = await this.productRepository.findRelated(id)

    return products.map((product) => ({
      ...product,
      images: optimizeProductImages(this.normalizeImages(product.images), 'listing'),
    }))
  }

  private toRepositoryQuery(query: ListProductsQuery) {
    return {
      filters: {
        category: query.category,
        careLevel: query.careLevel,
        lightLevel: query.lightLevel,
        size: query.size,
        petFriendly: query.petFriendly,
      },
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    }
  }
}
