import { describe, expect, it } from 'vitest'
import { formatDate, formatDateShort, formatMoney } from './format'

describe('formatMoney', () => {
  it('formatea un importe en euros sin decimales por defecto', () => {
    expect(formatMoney(25, 'EUR').replace(/\s/g, ' ')).toBe('25 €')
  })

  it('respeta los decimales solicitados', () => {
    expect(formatMoney(25.5, 'EUR', 2).replace(/\s/g, ' ')).toBe('25,50 €')
  })

  it('cae a un formato legible con una moneda inválida', () => {
    expect(formatMoney(10, 'XXXXX')).toContain('10')
  })

  it('usa EUR cuando no se indica moneda', () => {
    expect(formatMoney(10, '')).toContain('€')
  })
})

describe('formatDate', () => {
  it('formatea una fecha ISO en es-ES', () => {
    const result = formatDate('2026-07-23T10:30:00.000Z')
    expect(result).toMatch(/2026/)
  })

  it('devuelve el valor original si la fecha no es válida', () => {
    expect(formatDate('no-es-una-fecha')).toBe('no-es-una-fecha')
  })

  it('formatDateShort omite la hora', () => {
    const result = formatDateShort('2026-07-23T10:30:00.000Z')
    expect(result).toMatch(/2026/)
    expect(result).not.toMatch(/:/)
  })
})
