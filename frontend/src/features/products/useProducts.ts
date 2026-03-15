import { useEffect, useMemo, useState } from 'react'
import { productsRepository } from '../../services/products.repository'
import type { Product } from '../../types/product'

type UseProductsResult = {
  products: Product[]
  loading: boolean
  error: string | null
}

type UseProductResult = {
  product: Product | undefined
  loading: boolean
  error: string | null
}

const DEFAULT_ERROR_MESSAGE = 'No pudimos cargar los productos en este momento.'

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productsRepository.list()
        if (isMounted) {
          setProducts(data)
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError))
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [])

  return useMemo<UseProductsResult>(() => ({ products, loading, error }), [error, loading, products])
}

export const useFeaturedProducts = (limit = 4) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productsRepository.listFeatured()
        if (isMounted) {
          setProducts(data.slice(0, limit))
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError))
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [limit])

  return useMemo<UseProductsResult>(() => ({ products, loading, error }), [error, loading, products])
}

export const useProductById = (id?: string) => {
  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!id) {
      setProduct(undefined)
      setError(null)
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productsRepository.findById(id)
        if (isMounted) {
          setProduct(data)
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError))
          setProduct(undefined)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [id])

  return useMemo<UseProductResult>(() => ({ product, loading, error }), [error, loading, product])
}

export const useRelatedProducts = (productId?: string, limit = 3) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(Boolean(productId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!productId) {
      setProducts([])
      setError(null)
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await productsRepository.listRelated(productId)
        if (isMounted) {
          setProducts(data.slice(0, limit))
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError))
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [limit, productId])

  return useMemo<UseProductsResult>(() => ({ products, loading, error }), [error, loading, products])
}
