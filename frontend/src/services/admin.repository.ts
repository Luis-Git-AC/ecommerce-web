import { apiRequest } from './api.client'
import type { AdminOrdersPage, AdminUsersPage, OrderStatus } from '../types/commerce'

type WrappedResponse<T> = {
  data: T
}

export const adminRepository = {
  async listUsers(accessToken: string, query?: { page?: number; limit?: number; q?: string }) {
    const params = new URLSearchParams()

    if (query?.page) {
      params.set('page', String(query.page))
    }

    if (query?.limit) {
      params.set('limit', String(query.limit))
    }

    if (query?.q) {
      params.set('q', query.q)
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : ''

    const response = await apiRequest<WrappedResponse<AdminUsersPage>>(`/admin/users${suffix}`, {
      method: 'GET',
      accessToken,
    })

    return response.data
  },

  async listOrders(
    accessToken: string,
    query?: { page?: number; limit?: number; status?: OrderStatus; userId?: string; q?: string },
  ) {
    const params = new URLSearchParams()

    if (query?.page) {
      params.set('page', String(query.page))
    }

    if (query?.limit) {
      params.set('limit', String(query.limit))
    }

    if (query?.status) {
      params.set('status', query.status)
    }

    if (query?.userId) {
      params.set('userId', query.userId)
    }

    if (query?.q) {
      params.set('q', query.q)
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : ''

    const response = await apiRequest<WrappedResponse<AdminOrdersPage>>(`/admin/orders${suffix}`, {
      method: 'GET',
      accessToken,
    })

    return response.data
  },
}
