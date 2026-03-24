import { apiRequest } from './api.client'
import type { OrderStatus } from '../types/commerce'

type WrappedResponse<T> = {
  data: T
}

export type PaymentIntentSession = {
  orderId: string
  status: OrderStatus
  currency: string
  total: number
  paymentIntentId: string
  clientSecret: string
}

export const paymentsRepository = {
  async createIntent(accessToken: string, payload: { orderId: string; idempotencyKey?: string }) {
    const response = await apiRequest<WrappedResponse<PaymentIntentSession>>('/payments/intents', {
      method: 'POST',
      accessToken,
      body: payload,
    })

    return response.data
  },
}
