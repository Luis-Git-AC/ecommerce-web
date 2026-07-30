import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/commerce'

export type OrderTone = 'pending' | 'progress' | 'positive' | 'negative'

const STATUS_TONES: Record<OrderStatus, OrderTone> = {
  pending: 'pending',
  paid: 'positive',
  processing: 'progress',
  shipped: 'progress',
  delivered: 'positive',
  failed: 'negative',
  canceled: 'negative',
}

export const getOrderTone = (status: OrderStatus): OrderTone => STATUS_TONES[status]

export const getOrderStatusLabel = (status: OrderStatus): string => ORDER_STATUS_LABELS[status]

export const ORDER_TIMELINE_STEPS = [
  { status: 'pending', label: 'Creado' },
  { status: 'paid', label: 'Pagado' },
  { status: 'processing', label: 'Preparación' },
  { status: 'shipped', label: 'Enviado' },
  { status: 'delivered', label: 'Entregado' },
] as const satisfies ReadonlyArray<{ status: OrderStatus; label: string }>

export const isOrderFlowBroken = (status: OrderStatus): boolean =>
  status === 'failed' || status === 'canceled'

export type OrderTimelineStep = {
  status: OrderStatus
  label: string
  reached: boolean
  current: boolean
}

export const getOrderTimeline = (status: OrderStatus): OrderTimelineStep[] => {
  if (isOrderFlowBroken(status)) {
    return []
  }

  const currentIndex = ORDER_TIMELINE_STEPS.findIndex((step) => step.status === status)

  return ORDER_TIMELINE_STEPS.map((step, index) => ({
    status: step.status,
    label: step.label,
    reached: index <= currentIndex,
    current: index === currentIndex,
  }))
}

export const formatOrderRef = (id: string): string => `#${id.slice(-6).toUpperCase()}`

export const formatOrderItemCount = (totalItems: number): string =>
  `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`
