/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cartRepository } from '../services/cart.repository'
import { ApiClientError } from '../services/api.client'
import type { Cart } from '../types/commerce'
import { useAuth } from './AuthContext'

type CartContextValue = {
  cart: Cart | null
  totalItems: number
  loading: boolean
  error: string | null
  clearCartOptimistic: () => void
  refreshCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const toClientError = (error: unknown) => {
  if (error instanceof ApiClientError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'No pudimos actualizar tu carrito. Intenta de nuevo.'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth()
  const { pathname } = useLocation()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCart = useCallback(async (silent = false) => {
    if (!accessToken) {
      setCart(null)
      setError(null)
      return
    }

    if (!silent) {
      setLoading(true)
      setError(null)
    }

    try {
      const nextCart = await cartRepository.getCart(accessToken)
      setCart(nextCart)
      if (!silent) {
        setError(null)
      }
    } catch (incomingError) {
      if (!silent) {
        setError(toClientError(incomingError))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [accessToken])

  const refreshCart = useCallback(async () => {
    await loadCart(false)
  }, [loadCart])

  const clearCartOptimistic = useCallback(() => {
    setCart((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        items: [],
        subtotal: 0,
        total: 0,
        totalItems: 0,
      }
    })
  }, [])

  useEffect(() => {
    void refreshCart()
  }, [refreshCart])

  useEffect(() => {
    void loadCart(true)
  }, [loadCart, pathname])

  useEffect(() => {
    const onFocus = () => {
      void loadCart(true)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadCart(true)
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [loadCart])

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!accessToken) {
      throw new Error('Debes iniciar sesión para usar el carrito.')
    }

    setError(null)
    const nextCart = await cartRepository.addItem(accessToken, { productId, quantity })
    setCart(nextCart)
  }, [accessToken])

  const updateItemQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!accessToken) {
      throw new Error('Debes iniciar sesión para usar el carrito.')
    }

    if (quantity <= 0) {
      const nextCart = await cartRepository.removeItem(accessToken, productId)
      setCart(nextCart)
      return
    }

    const nextCart = await cartRepository.updateItem(accessToken, productId, quantity)
    setCart(nextCart)
  }, [accessToken])

  const removeItem = useCallback(async (productId: string) => {
    if (!accessToken) {
      throw new Error('Debes iniciar sesión para usar el carrito.')
    }

    const nextCart = await cartRepository.removeItem(accessToken, productId)
    setCart(nextCart)
  }, [accessToken])

  const clearCart = useCallback(async () => {
    if (!accessToken) {
      throw new Error('Debes iniciar sesión para usar el carrito.')
    }

    const nextCart = await cartRepository.clear(accessToken)
    setCart(nextCart)
  }, [accessToken])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      totalItems: cart?.totalItems ?? 0,
      loading,
      error,
      clearCartOptimistic,
      refreshCart,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
    }),
    [addToCart, cart, clearCart, clearCartOptimistic, error, loading, refreshCart, removeItem, updateItemQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
