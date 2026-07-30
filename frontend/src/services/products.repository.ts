import { apiRequest } from './api.client'
import type {
  Product,
  ProductListFilters,
  ProductListPage,
  ProductSortOption,
} from '../types/product'

type ProductApiImage = {
  url: string
  alt: string
}

type ProductApi = {
  _id: string
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
  isFeatured?: boolean
  stock?: number
  tags?: string[]
  images: ProductApiImage[]
}

type ProductListApiResponse = {
  items: ProductApi[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const toProductImage = (image?: ProductApiImage) => ({
  src: image?.url ?? '',
})

const mapApiProduct = (product: ProductApi): Product => ({
  id: product._id,
  slug: product.slug,
  name: product.name,
  description: product.description ?? '',
  price: product.price,
  currency: product.currency || 'EUR',
  category: product.category,
  careLevel: product.careLevel,
  lightRequired: product.lightLevel,
  petSafe: product.petFriendly,
  size: product.size,
  isFeatured: product.isFeatured ?? false,
  stock: product.stock ?? 0,
  tags: product.tags ?? [],
  images: {
    card: toProductImage(product.images[0]),
    gallery: product.images.slice(1).map((item) => toProductImage(item)),
  },
})

const buildListQuery = (filters: ProductListFilters = {}) => {
  const params = new URLSearchParams()

  if (filters.page !== undefined) {
    params.set('page', String(filters.page))
  }

  if (filters.limit !== undefined) {
    params.set('limit', String(filters.limit))
  }

  const multiValueFilters: Array<[string, string[] | undefined]> = [
    ['category', filters.category],
    ['careLevel', filters.careLevel],
    ['lightLevel', filters.lightLevel],
    ['size', filters.size],
  ]

  for (const [key, values] of multiValueFilters) {
    for (const value of values ?? []) {
      params.append(key, value)
    }
  }

  if (typeof filters.petFriendly === 'boolean') {
    params.set('petFriendly', String(filters.petFriendly))
  }

  const searchTerm = filters.q?.trim()
  if (searchTerm) {
    params.set('q', searchTerm)
  }

  if (filters.sort) {
    params.set('sort', filters.sort)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export type ProductsRepository = {
  list: (filters?: ProductListFilters) => Promise<ProductListPage>
  findById: (id: string) => Promise<Product>
  findBySlug: (slug: string) => Promise<Product>
  listRelated: (productId: string) => Promise<Product[]>
  listFeatured: () => Promise<Product[]>
}

export const productsRepository: ProductsRepository = {
  async list(filters) {
    const response = await apiRequest<ProductListApiResponse>(`/products${buildListQuery(filters)}`)

    return {
      items: response.items.map(mapApiProduct),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    }
  },

  async findById(id) {
    const product = await apiRequest<ProductApi>(`/products/${encodeURIComponent(id)}`)
    return mapApiProduct(product)
  },

  async findBySlug(slug) {
    const product = await apiRequest<ProductApi>(`/products/slug/${encodeURIComponent(slug)}`)
    return mapApiProduct(product)
  },

  async listRelated(productId) {
    const products = await apiRequest<ProductApi[]>(
      `/products/related/${encodeURIComponent(productId)}`,
    )
    return products.map(mapApiProduct)
  },

  async listFeatured() {
    const products = await apiRequest<ProductApi[]>('/products/featured')
    return products.map(mapApiProduct)
  },
}

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = ['featured', 'price_asc', 'price_desc']
