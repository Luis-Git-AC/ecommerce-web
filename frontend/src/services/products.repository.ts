import { productsMock } from '../mocks/products.mock'
import type { Product } from '../types/product'

export type ProductsRepository = {
  list: () => Product[]
  findById: (id: string) => Product | undefined
  listRelated: (productId: string, limit?: number) => Product[]
  listFeatured: (limit?: number) => Product[]
}

export const productsRepository: ProductsRepository = {
  list: () => productsMock,
  findById: (id) => productsMock.find((item) => item.id === id),
  listRelated: (productId, limit = 3) => productsMock.filter((item) => item.id !== productId).slice(0, limit),
  listFeatured: (limit = 4) => productsMock.slice(0, limit),
}
