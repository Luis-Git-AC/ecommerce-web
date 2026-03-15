import { Types } from 'mongoose'
import { ProductModel, type ProductDocument } from '../schemas/product.schema'

type ProductSort = 'featured' | 'price_asc' | 'price_desc'

type ProductFilters = {
  category?: string
  careLevel?: string
  lightLevel?: string
  size?: string
  petFriendly?: boolean
}

type FindAllProductsOptions = {
  filters: ProductFilters
  page: number
  limit: number
  sort: ProductSort
}

const SORT_MAP: Record<ProductSort, Record<string, 1 | -1>> = {
  featured: { isFeatured: -1, createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
}

export type PaginatedProducts = {
  items: ProductDocument[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ProductRepository {
  async findAll(options: FindAllProductsOptions): Promise<PaginatedProducts> {
    const { filters, page, limit, sort } = options
    const query = {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.careLevel ? { careLevel: filters.careLevel } : {}),
      ...(filters.lightLevel ? { lightLevel: filters.lightLevel } : {}),
      ...(filters.size ? { size: filters.size } : {}),
      ...(typeof filters.petFriendly === 'boolean' ? { petFriendly: filters.petFriendly } : {}),
    }

    const [items, total] = await Promise.all([
      ProductModel.find(query)
        .sort(SORT_MAP[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return ProductModel.findById(id).lean()
  }

  async findFeatured(limit = 8): Promise<ProductDocument[]> {
    return ProductModel.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(limit).lean()
  }

  async findRelated(productId: string, limit = 4): Promise<ProductDocument[]> {
    const product = await ProductModel.findById(productId).select({ category: 1 }).lean()

    if (!product) {
      return []
    }

    return ProductModel.find({
      _id: { $ne: new Types.ObjectId(productId) },
      category: product.category,
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .lean()
  }
}
