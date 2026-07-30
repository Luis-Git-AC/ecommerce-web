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

export type ShippingAddress = {
  fullName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  province: string
  country: string
  phone: string
}

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'failed',
  'canceled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente de pago',
  paid: 'Pagado',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  failed: 'Fallido',
  canceled: 'Cancelado',
}

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'failed', 'canceled'],
  paid: ['processing', 'canceled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  failed: [],
  canceled: [],
}

export type AdminProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  careLevel: string
  lightLevel: string
  size: string
  petFriendly: boolean
  isFeatured: boolean
  stock: number
  isActive: boolean
  images: Array<{ url: string; alt: string; publicId?: string }>
  tags: string[]
  createdAt?: string
  updatedAt?: string
}

export type AdminProductsPage = {
  items: AdminProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminStats = {
  revenue: { total: number; paidOrders: number; currency: string }
  ordersByStatus: Partial<Record<OrderStatus, number>>
  topProducts: Array<{ slug: string; name: string; units: number; revenue: number }>
  newUsersLast30Days: number
  lowStockProducts: number
  totals: { activeProducts: number; totalUsers: number; totalOrders: number }
}

export type AdminContactMessage = {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

export type AdminContactMessagesPage = {
  items: AdminContactMessage[]
  page: number
  limit: number
  total: number
  totalPages: number
}

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
  shippingAddress?: ShippingAddress
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
