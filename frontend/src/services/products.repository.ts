import type { Product } from '../types/product'

type ProductApiImage = {
  url: string
  alt: string
}

type ProductApi = {
  _id: string
  slug: string
  name: string
  price: number
  currency: string
  category: string
  careLevel: string
  lightLevel: string
  size: string
  petFriendly: boolean
  images: ProductApiImage[]
}

type ProductListResponse = {
  items: ProductApi[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:4000/api'

const toProductImage = (image?: ProductApiImage) => ({
  src: image?.url ?? '',
})

const formatPrice = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} EUR`
  }
}

const mapApiProduct = (product: ProductApi): Product => ({
  id: product._id,
  name: product.name,
  price: formatPrice(product.price, product.currency),
  category: product.category,
  careLevel: product.careLevel,
  lightRequired: product.lightLevel,
  petSafe: product.petFriendly,
  size: product.size,
  images: {
    card: toProductImage(product.images[0]),
    gallery: product.images.slice(1).map((item) => toProductImage(item)),
  },
})

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

export type ProductsRepository = {
  list: () => Promise<Product[]>
  findById: (id: string) => Promise<Product | undefined>
  listRelated: (productId: string) => Promise<Product[]>
  listFeatured: () => Promise<Product[]>
}

export const productsRepository: ProductsRepository = {
  async list() {
    const response = await getJson<ProductListResponse>('/products')
    return response.items.map(mapApiProduct)
  },
  async findById(id) {
    const product = await getJson<ProductApi>(`/products/${id}`)
    return mapApiProduct(product)
  },
  async listRelated(productId) {
    const products = await getJson<ProductApi[]>(`/products/related/${productId}`)
    return products.map(mapApiProduct)
  },
  async listFeatured() {
    const products = await getJson<ProductApi[]>('/products/featured')
    return products.map(mapApiProduct)
  },
}
