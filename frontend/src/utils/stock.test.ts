import { describe, expect, it } from 'vitest'
import { getStockLabel, getStockStatus, LOW_STOCK_THRESHOLD } from './stock'

describe('getStockStatus', () => {
  it('marca como agotado el stock cero o negativo', () => {
    expect(getStockStatus(0)).toBe('out')
    expect(getStockStatus(-3)).toBe('out')
  })

  it('marca como bajo el stock dentro del umbral', () => {
    expect(getStockStatus(1)).toBe('low')
    expect(getStockStatus(LOW_STOCK_THRESHOLD)).toBe('low')
  })

  it('marca como disponible el stock por encima del umbral', () => {
    expect(getStockStatus(LOW_STOCK_THRESHOLD + 1)).toBe('available')
    expect(getStockStatus(50)).toBe('available')
  })
})

describe('getStockLabel', () => {
  it('devuelve "Agotado" sin stock', () => {
    expect(getStockLabel(0)).toBe('Agotado')
  })

  it('usa singular para la última unidad', () => {
    expect(getStockLabel(1)).toBe('Última unidad')
  })

  it('usa plural para varias unidades bajas', () => {
    expect(getStockLabel(3)).toBe('Últimas 3 unidades')
  })

  it('no devuelve etiqueta con stock holgado', () => {
    expect(getStockLabel(20)).toBeNull()
  })
})
