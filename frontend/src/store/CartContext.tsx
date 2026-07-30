/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCartMutations, useCartQuery } from '@/features/cart/queries'
import { ApiClientError } from '@/services/api.client'
import type { Cart } from '@/types/commerce'
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
  if (error instanceof ApiClientError || error instanceof Error) {
    return error.message
  }

  return 'No pudimos actualizar tu carrito. Intenta de nuevo.'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth()
  const { data, isLoading, error: queryError } = useCartQuery(accessToken)
  const { addItem, updateItem, removeItem, clearCart, invalidate, clearOptimistic } =
    useCartMutations(accessToken)

  const value = useMemo<CartContextValue>(() => {
    const cart = accessToken ? (data ?? null) : null

    return {
      cart,
      totalItems: cart?.totalItems ?? 0,
      loading: Boolean(accessToken) && isLoading,
      error: queryError ? toClientError(queryError) : null,

      clearCartOptimistic: clearOptimistic,

      refreshCart: async () => {
        await invalidate()
      },

      addToCart: async (productId, quantity = 1) => {
        if (!accessToken) {
          throw new Error('Debes iniciar sesión para usar el carrito.')
        }

        await addItem.mutateAsync({ productId, quantity })
      },

      updateItemQuantity: async (productId, quantity) => {
        if (!accessToken) {
          throw new Error('Debes iniciar sesión para usar el carrito.')
        }

        if (quantity <= 0) {
          await removeItem.mutateAsync(productId)
          return
        }

        await updateItem.mutateAsync({ productId, quantity })
      },

      removeItem: async (productId) => {
        if (!accessToken) {
          throw new Error('Debes iniciar sesión para usar el carrito.')
        }

        await removeItem.mutateAsync(productId)
      },

      clearCart: async () => {
        if (!accessToken) {
          throw new Error('Debes iniciar sesión para usar el carrito.')
        }

        await clearCart.mutateAsync()
      },
    }
  }, [
    accessToken,
    addItem,
    clearCart,
    clearOptimistic,
    data,
    invalidate,
    isLoading,
    queryError,
    removeItem,
    updateItem,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
