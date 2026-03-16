export type SessionUser = {
  id: string
  name: string
  email: string
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

export type OrderSummary = {
  id: string
  status: 'pending' | 'canceled'
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
  status: 'pending' | 'canceled'
  currency: string
  subtotal: number
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}
