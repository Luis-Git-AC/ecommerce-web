import { apiRequest } from './api.client'
import type { Cart } from '../types/commerce'

type WrappedResponse<T> = {
  data: T
}

export const cartRepository = {
  async getCart(accessToken: string) {
    const response = await apiRequest<WrappedResponse<Cart>>('/cart', { accessToken })
    return response.data
  },

  async addItem(accessToken: string, payload: { productId: string; quantity: number }) {
    const response = await apiRequest<WrappedResponse<Cart>>('/cart/items', {
      method: 'POST',
      accessToken,
      body: payload,
    })

    return response.data
  },

  async updateItem(accessToken: string, productId: string, quantity: number) {
    const response = await apiRequest<WrappedResponse<Cart>>(`/cart/items/${productId}`, {
      method: 'PATCH',
      accessToken,
      body: { quantity },
    })

    return response.data
  },

  async removeItem(accessToken: string, productId: string) {
    const response = await apiRequest<WrappedResponse<Cart>>(`/cart/items/${productId}`, {
      method: 'DELETE',
      accessToken,
    })

    return response.data
  },

  async clear(accessToken: string) {
    const response = await apiRequest<WrappedResponse<Cart>>('/cart/clear', {
      method: 'DELETE',
      accessToken,
    })

    return response.data
  },
}
