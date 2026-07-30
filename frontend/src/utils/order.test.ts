import { describe, expect, it } from 'vitest'
import { ORDER_STATUSES } from '@/types/commerce'
import {
  formatOrderItemCount,
  formatOrderRef,
  getOrderTimeline,
  getOrderTone,
  isOrderFlowBroken,
} from './order'

describe('getOrderTone', () => {
  it('agrupa los 7 estados del backend en los 4 tonos', () => {
    expect(getOrderTone('pending')).toBe('pending')
    expect(getOrderTone('paid')).toBe('positive')
    expect(getOrderTone('processing')).toBe('progress')
    expect(getOrderTone('shipped')).toBe('progress')
    expect(getOrderTone('delivered')).toBe('positive')
    expect(getOrderTone('failed')).toBe('negative')
    expect(getOrderTone('canceled')).toBe('negative')
  })

  it('cubre todos los estados declarados: si el backend anade uno, este test falla', () => {
    for (const status of ORDER_STATUSES) {
      expect(getOrderTone(status)).toBeDefined()
    }
  })
})

describe('getOrderTimeline', () => {
  it('marca como alcanzados los pasos hasta el estado actual', () => {
    const timeline = getOrderTimeline('processing')

    expect(timeline.map((step) => step.reached)).toEqual([true, true, true, false, false])
  })

  it('marca un unico paso como actual', () => {
    const timeline = getOrderTimeline('shipped')
    const current = timeline.filter((step) => step.current)

    expect(current).toHaveLength(1)
    expect(current[0].status).toBe('shipped')
  })

  it('un pedido entregado tiene todos los pasos alcanzados', () => {
    const timeline = getOrderTimeline('delivered')

    expect(timeline.every((step) => step.reached)).toBe(true)
  })

  it('un pedido recien creado solo tiene el primer paso alcanzado', () => {
    const timeline = getOrderTimeline('pending')

    expect(timeline.map((step) => step.reached)).toEqual([true, false, false, false, false])
  })

  it('no devuelve pasos si el pedido salio del flujo', () => {
    expect(getOrderTimeline('failed')).toEqual([])
    expect(getOrderTimeline('canceled')).toEqual([])
  })
})

describe('isOrderFlowBroken', () => {
  it('solo failed y canceled rompen el flujo', () => {
    const broken = ORDER_STATUSES.filter((status) => isOrderFlowBroken(status))

    expect(broken).toEqual(['failed', 'canceled'])
  })
})

describe('formatOrderRef', () => {
  it('reduce el id de Mongo a una referencia legible en mayusculas', () => {
    expect(formatOrderRef('6a0b95f61c897b7eeea4438c')).toBe('#A4438C')
  })

  it('no rompe con ids mas cortos que la referencia', () => {
    expect(formatOrderRef('abc')).toBe('#ABC')
  })
})

describe('formatOrderItemCount', () => {
  it('usa singular con un solo producto', () => {
    expect(formatOrderItemCount(1)).toBe('1 producto')
  })

  it('usa plural con varios', () => {
    expect(formatOrderItemCount(3)).toBe('3 productos')
  })
})
