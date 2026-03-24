export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export type AuthSession = {
  user: SessionUser
  accessToken: string
  refreshToken: string
}

export type CartItem = {
  productId: string
  slug: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  currency: string
  lineTotal: number
}

export type Cart = {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  total: number
  totalItems: number
}

export type OrderItem = {
  productId: string
  slug: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  currency: string
  lineTotal: number
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'canceled'

export type OrderSummary = {
  id: string
  status: OrderStatus
  currency: string
  total: number
  totalItems: number
  createdAt: string
}

export type OrdersPage = {
  items: OrderSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type OrderDetail = {
  id: string
  userId: string
  status: OrderStatus
  currency: string
  subtotal: number
  total: number
  paymentIntentId?: string
  paymentLastError?: string
  paidAt?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type AdminUserSummary = {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  ordersCount: number
}

export type AdminUsersPage = {
  items: AdminUserSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminOrderSummary = {
  id: string
  status: OrderStatus
  currency: string
  total: number
  totalItems: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: 'user' | 'admin'
  }
}

export type AdminOrdersPage = {
  items: AdminOrderSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}
