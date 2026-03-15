import { describe, expect, it } from 'vitest'
import { listProductsQuerySchema } from '../src/modules/products/dto/list-products.query'

describe('Products query schema', () => {
  it('applies defaults when query is empty', () => {
    const result = listProductsQuerySchema.parse({})

    expect(result.page).toBe(1)
    expect(result.limit).toBe(12)
    expect(result.sort).toBe('featured')
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
    expect(result.category).toBe('indoor')
    expect(result.careLevel).toBe('easy')
    expect(result.lightLevel).toBe('medium')
    expect(result.size).toBe('m')
    expect(result.petFriendly).toBe(true)
    expect(result.sort).toBe('price_desc')
  })

  it('rejects invalid sort values', () => {
    const parsed = listProductsQuerySchema.safeParse({ sort: 'latest' })
    expect(parsed.success).toBe(false)
  })
})
