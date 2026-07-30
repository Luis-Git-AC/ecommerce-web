import { ApiClientError, apiRequest } from './api.client'
import { appEnv } from '@/config/env'
import type {
  AdminContactMessagesPage,
  AdminOrdersPage,
  AdminProduct,
  AdminProductsPage,
  AdminStats,
  AdminUsersPage,
  OrderStatus,
} from '@/types/commerce'

type WrappedResponse<T> = {
  data: T
}

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }

  const queryString = search.toString()
  return queryString ? `?${queryString}` : ''
}

export const adminRepository = {
  async listUsers(accessToken: string, query?: { page?: number; limit?: number; q?: string }) {
    const response = await apiRequest<WrappedResponse<AdminUsersPage>>(
      `/admin/users${buildQuery({ ...query })}`,
      { accessToken },
    )

    return response.data
  },

  async listOrders(
    accessToken: string,
    query?: { page?: number; limit?: number; status?: OrderStatus; userId?: string; q?: string },
  ) {
    const response = await apiRequest<WrappedResponse<AdminOrdersPage>>(
      `/admin/orders${buildQuery({ ...query })}`,
      { accessToken },
    )

    return response.data
  },

  async listProducts(accessToken: string, query?: { page?: number; limit?: number; q?: string }) {
    const response = await apiRequest<WrappedResponse<AdminProductsPage>>(
      `/admin/products${buildQuery({ ...query })}`,
      { accessToken },
    )

    return response.data
  },

  async createProduct(accessToken: string, payload: Record<string, unknown>) {
    const response = await apiRequest<WrappedResponse<AdminProduct>>('/admin/products', {
      method: 'POST',
      accessToken,
      body: payload,
    })

    return response.data
  },

  async updateProduct(accessToken: string, productId: string, payload: Record<string, unknown>) {
    const response = await apiRequest<WrappedResponse<AdminProduct>>(
      `/admin/products/${productId}`,
      { method: 'PATCH', accessToken, body: payload },
    )

    return response.data
  },

  async deactivateProduct(accessToken: string, productId: string) {
    const response = await apiRequest<WrappedResponse<AdminProduct>>(
      `/admin/products/${productId}`,
      { method: 'DELETE', accessToken },
    )

    return response.data
  },

  async uploadProductImage(accessToken: string, productId: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${appEnv.apiBaseUrl}/admin/products/${productId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })

    if (!response.ok) {
      let message = `No pudimos subir la imagen (${response.status})`

      try {
        const data = (await response.json()) as { message?: string }
        if (data.message) {
          message = data.message
        }
      } catch {
        // noop
      }

      throw new ApiClientError(response.status, message)
    }

    const data = (await response.json()) as WrappedResponse<AdminProduct>
    return data.data
  },

  async deleteProductImage(accessToken: string, productId: string, publicId: string) {
    const response = await apiRequest<WrappedResponse<AdminProduct>>(
      `/admin/products/${productId}/images/${encodeURIComponent(publicId)}`,
      { method: 'DELETE', accessToken },
    )

    return response.data
  },

  async updateOrderStatus(accessToken: string, orderId: string, status: OrderStatus) {
    const response = await apiRequest<WrappedResponse<{ id: string; status: OrderStatus }>>(
      `/admin/orders/${orderId}/status`,
      { method: 'PATCH', accessToken, body: { status } },
    )

    return response.data
  },

  async getStats(accessToken: string) {
    const response = await apiRequest<WrappedResponse<AdminStats>>('/admin/stats', { accessToken })
    return response.data
  },

  async listContactMessages(accessToken: string, query?: { page?: number; limit?: number }) {
    const response = await apiRequest<WrappedResponse<AdminContactMessagesPage>>(
      `/admin/contact-messages${buildQuery({ ...query })}`,
      { accessToken },
    )

    return response.data
  },
}
