export type ProductCategory = string

export type ProductCareLevel = string

export type ProductLightRequired = string

export type ProductSize = string

export type ProductImage = {
  src: string
  webp?: string
  jpg?: string
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency: string
  category: ProductCategory
  careLevel: ProductCareLevel
  lightRequired: ProductLightRequired
  petSafe: boolean
  size: ProductSize
  isFeatured: boolean
  stock: number
  tags: string[]
  images: {
    card: ProductImage
    gallery: ProductImage[]
  }
}

export type ProductSortOption = 'featured' | 'price_asc' | 'price_desc'

export type ProductListFilters = {
  page?: number
  limit?: number
  category?: string[]
  careLevel?: string[]
  lightLevel?: string[]
  size?: string[]
  petFriendly?: boolean
  q?: string
  sort?: ProductSortOption
}

export type ProductListPage = {
  items: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}
