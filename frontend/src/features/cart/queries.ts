import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartRepository } from '@/services/cart.repository'
import type { Cart } from '@/types/commerce'

export const cartKeys = {
  all: ['cart'] as const,
  detail: () => [...cartKeys.all, 'detail'] as const,
}

export const useCartQuery = (accessToken: string | null) =>
  useQuery({
    queryKey: cartKeys.detail(),
    queryFn: () => cartRepository.getCart(accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  })

type MutationContext = { previous?: Cart }

export const useCartMutations = (accessToken: string | null) => {
  const queryClient = useQueryClient()

  const setCartData = (cart: Cart) => {
    queryClient.setQueryData(cartKeys.detail(), cart)
  }

  const addItem = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      cartRepository.addItem(accessToken as string, { productId, quantity }),
    onSuccess: setCartData,
  })

  const updateItem = useMutation<
    Cart,
    Error,
    { productId: string; quantity: number },
    MutationContext
  >({
    mutationFn: ({ productId, quantity }) =>
      cartRepository.updateItem(accessToken as string, productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.detail() })
      const previous = queryClient.getQueryData<Cart>(cartKeys.detail())

      if (previous) {
        const items = previous.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity, lineTotal: Number((item.unitPrice * quantity).toFixed(2)) }
            : item,
        )

        const subtotal = Number(items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2))

        queryClient.setQueryData<Cart>(cartKeys.detail(), {
          ...previous,
          items,
          subtotal,
          total: subtotal,
          totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
        })
      }

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKeys.detail(), context.previous)
      }
    },
    onSuccess: setCartData,
  })

  const removeItem = useMutation({
    mutationFn: (productId: string) => cartRepository.removeItem(accessToken as string, productId),
    onSuccess: setCartData,
  })

  const clearCart = useMutation({
    mutationFn: () => cartRepository.clear(accessToken as string),
    onSuccess: setCartData,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: cartKeys.all })

  const clearOptimistic = () => {
    const previous = queryClient.getQueryData<Cart>(cartKeys.detail())
    if (previous) {
      queryClient.setQueryData<Cart>(cartKeys.detail(), {
        ...previous,
        items: [],
        subtotal: 0,
        total: 0,
        totalItems: 0,
      })
    }
  }

  return { addItem, updateItem, removeItem, clearCart, invalidate, clearOptimistic }
}
