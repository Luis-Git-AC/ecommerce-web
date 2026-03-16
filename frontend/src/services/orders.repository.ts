import { apiRequest } from './api.client'
import type { OrderDetail, OrdersPage } from '../types/commerce'

type WrappedResponse<T> = {
  data: T
}

export const ordersRepository = {
  async create(accessToken: string) {
    const response = await apiRequest<WrappedResponse<OrderDetail>>('/orders', {
      method: 'POST',
      accessToken,
    })

    return response.data
  },

  async list(accessToken: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams()

    if (params?.page) {
      query.set('page', String(params.page))
    }

    if (params?.limit) {
      query.set('limit', String(params.limit))
    }

    const suffix = query.toString() ? `?${query.toString()}` : ''
    const response = await apiRequest<WrappedResponse<OrdersPage>>(`/orders${suffix}`, {
      accessToken,
    })

    return response.data
  },

  async getById(accessToken: string, orderId: string) {
    const response = await apiRequest<WrappedResponse<OrderDetail>>(`/orders/${orderId}`, {
      accessToken,
    })

    return response.data
  },
}
