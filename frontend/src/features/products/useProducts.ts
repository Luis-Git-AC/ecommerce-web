import { useMemo } from 'react'
import { productsRepository } from '../../services/products.repository'

export const useProducts = () => {
  return useMemo(() => productsRepository.list(), [])
}

export const useFeaturedProducts = (limit = 4) => {
  return useMemo(() => productsRepository.listFeatured(limit), [limit])
}

export const useProductById = (id?: string) => {
  return useMemo(() => (id ? productsRepository.findById(id) : undefined), [id])
}

export const useRelatedProducts = (productId?: string, limit = 3) => {
  return useMemo(() => {
    if (!productId) {
      return []
    }

    return productsRepository.listRelated(productId, limit)
  }, [limit, productId])
}
