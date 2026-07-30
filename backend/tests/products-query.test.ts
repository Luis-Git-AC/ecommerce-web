import { describe, expect, it } from 'vitest'
import { listProductsQuerySchema } from '../src/modules/products/dto/list-products.query'

describe('Products query schema', () => {
  it('applies defaults when query is empty', () => {
    const result = listProductsQuerySchema.parse({})

    expect(result.page).toBe(1)
    expect(result.limit).toBe(12)
    expect(result.sort).toBe('featured')
    expect(result.category).toBeUndefined()
    expect(result.q).toBeUndefined()
  })

  it('parses valid filters and sort', () => {
    const result = listProductsQuerySchema.parse({
      page: '2',
      limit: '10',
      category: 'indoor',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: 'true',
      sort: 'price_desc',
    })

    expect(result.page).toBe(2)
    expect(result.limit).toBe(10)
    // Los filtros son de seleccion multiple: un valor unico se normaliza a lista.
    expect(result.category).toEqual(['indoor'])
    expect(result.careLevel).toEqual(['easy'])
    expect(result.lightLevel).toEqual(['medium'])
    expect(result.size).toEqual(['m'])
    expect(result.petFriendly).toBe(true)
    expect(result.sort).toBe('price_desc')
  })

  it('acepta parametros repetidos como los envia Express', () => {
    const result = listProductsQuerySchema.parse({
      category: ['interior', 'florales'],
      size: ['s', 'm', 'l'],
    })

    expect(result.category).toEqual(['interior', 'florales'])
    expect(result.size).toEqual(['s', 'm', 'l'])
  })

  it('acepta listas separadas por comas y elimina duplicados', () => {
    const result = listProductsQuerySchema.parse({
      category: 'interior,florales,interior',
    })

    expect(result.category).toEqual(['interior', 'florales'])
  })

  it('ignora valores vacios y espacios sobrantes', () => {
    const result = listProductsQuerySchema.parse({
      category: ' interior , , florales ',
      careLevel: '',
    })

    expect(result.category).toEqual(['interior', 'florales'])
    expect(result.careLevel).toBeUndefined()
  })

  it('acepta el termino de busqueda y lo normaliza', () => {
    const result = listProductsQuerySchema.parse({ q: '  monstera  ' })
    expect(result.q).toBe('monstera')
  })

  it('rejects invalid sort values', () => {
    const parsed = listProductsQuerySchema.safeParse({ sort: 'latest' })
    expect(parsed.success).toBe(false)
  })
})
