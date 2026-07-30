import { Types } from 'mongoose'
import { escapeRegex } from '../../../common/utils/regex'
import { ProductModel, type ProductDocument } from '../schemas/product.schema'

type ProductSort = 'featured' | 'price_asc' | 'price_desc'

type ProductFilters = {
  category?: string[]
  careLevel?: string[]
  lightLevel?: string[]
  size?: string[]
  petFriendly?: boolean
  q?: string
}

const toMatch = (values?: string[]) => {
  if (!values || values.length === 0) {
    return undefined
  }

  return values.length === 1 ? values[0] : { $in: values }
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
    const searchTerm = filters.q?.trim()
    const categoryMatch = toMatch(filters.category)
    const careLevelMatch = toMatch(filters.careLevel)
    const lightLevelMatch = toMatch(filters.lightLevel)
    const sizeMatch = toMatch(filters.size)

    const query = {
      isActive: true,
      ...(categoryMatch !== undefined ? { category: categoryMatch } : {}),
      ...(careLevelMatch !== undefined ? { careLevel: careLevelMatch } : {}),
      ...(lightLevelMatch !== undefined ? { lightLevel: lightLevelMatch } : {}),
      ...(sizeMatch !== undefined ? { size: sizeMatch } : {}),
      ...(typeof filters.petFriendly === 'boolean' ? { petFriendly: filters.petFriendly } : {}),
      ...(searchTerm
        ? {
            $or: [
              { name: { $regex: escapeRegex(searchTerm), $options: 'i' } },
              { description: { $regex: escapeRegex(searchTerm), $options: 'i' } },
              { tags: { $regex: escapeRegex(searchTerm), $options: 'i' } },
            ],
          }
        : {}),
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
    return ProductModel.findOne({ _id: id, isActive: true }).lean()
  }

  async findBySlug(slug: string): Promise<ProductDocument | null> {
    return ProductModel.findOne({ slug, isActive: true }).lean()
  }

  async findFeatured(limit = 8): Promise<ProductDocument[]> {
    return ProductModel.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
  }

  async findRelated(productId: string, limit = 4): Promise<ProductDocument[]> {
    const product = await ProductModel.findOne({ _id: productId, isActive: true })
      .select({ category: 1 })
      .lean()

    if (!product) {
      return []
    }

    return ProductModel.find({
      _id: { $ne: new Types.ObjectId(productId) },
      category: product.category,
      isActive: true,
    })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .lean()
  }
}
