import { useQuery } from '@tanstack/react-query'
import { productsRepository } from '@/services/products.repository'
import type { ProductListFilters } from '@/types/product'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detailById: (id: string) => [...productKeys.details(), 'id', id] as const,
  detailBySlug: (slug: string) => [...productKeys.details(), 'slug', slug] as const,
  featured: (limit: number) => [...productKeys.all, 'featured', limit] as const,
  related: (productId: string, limit: number) =>
    [...productKeys.all, 'related', productId, limit] as const,
}

export const useProductsQuery = (filters: ProductListFilters) =>
  useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsRepository.list(filters),
    placeholderData: (previous) => previous,
  })

export const useProductByIdQuery = (id?: string) =>
  useQuery({
    queryKey: productKeys.detailById(id ?? ''),
    queryFn: () => productsRepository.findById(id as string),
    enabled: Boolean(id),
  })

export const useProductBySlugQuery = (slug?: string) =>
  useQuery({
    queryKey: productKeys.detailBySlug(slug ?? ''),
    queryFn: () => productsRepository.findBySlug(slug as string),
    enabled: Boolean(slug),
  })

export const useFeaturedProductsQuery = (limit = 4) =>
  useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: async () => (await productsRepository.listFeatured()).slice(0, limit),
  })

export const useRelatedProductsQuery = (productId?: string, limit = 3) =>
  useQuery({
    queryKey: productKeys.related(productId ?? '', limit),
    queryFn: async () =>
      (await productsRepository.listRelated(productId as string)).slice(0, limit),
    enabled: Boolean(productId),
  })
