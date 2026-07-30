import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { ProductModel } from '../src/modules/products/schemas/product.schema'

const suffix = `p${Date.now()}`

const buildProduct = (overrides: Record<string, unknown>) => ({
  // El sufijo va en la descripcion para poder aislar los productos de esta
  // suite con ?q= sin que interfieran los sembrados por otros tests.
  description: `Producto de catalogo para tests de listado ${suffix}`,
  currency: 'EUR',
  petFriendly: false,
  isFeatured: false,
  stock: 50,
  isActive: true,
  images: [{ url: 'https://example.com/plant.jpg', alt: 'Planta' }],
  tags: [],
  ...overrides,
})

describe('Products listing integration', () => {
  beforeAll(async () => {
    await connectToDatabase()

    await ProductModel.create([
      buildProduct({
        slug: `monstera-${suffix}`,
        name: 'Monstera Deliciosa',
        price: 30,
        category: 'interior',
        careLevel: 'easy',
        lightLevel: 'medium',
        size: 'l',
        tags: ['tropical'],
      }),
      buildProduct({
        slug: `echeveria-${suffix}`,
        name: 'Echeveria Elegans',
        price: 10,
        category: 'suculentas',
        careLevel: 'easy',
        lightLevel: 'high',
        size: 'xs',
      }),
      buildProduct({
        slug: `orquidea-${suffix}`,
        name: 'Orquidea Phalaenopsis',
        price: 45,
        category: 'florales',
        careLevel: 'medium',
        lightLevel: 'medium',
        size: 'm',
      }),
    ])
  })

  afterAll(async () => {
    await ProductModel.deleteMany({ slug: { $regex: `-${suffix}$` } })
    await disconnectDatabase()
  })

  it('devuelve la respuesta paginada completa', async () => {
    const response = await request(app).get('/api/products?limit=2&page=1')

    expect(response.status).toBe(200)
    expect(response.body.items.length).toBeLessThanOrEqual(2)
    expect(response.body).toMatchObject({ page: 1, limit: 2 })
    expect(typeof response.body.total).toBe('number')
    expect(typeof response.body.totalPages).toBe('number')
  })

  it('filtra por una unica categoria', async () => {
    const response = await request(app).get('/api/products?category=suculentas&limit=50')

    expect(response.status).toBe(200)
    const slugs = response.body.items.map((item: { slug: string }) => item.slug)
    expect(slugs).toContain(`echeveria-${suffix}`)
    expect(slugs).not.toContain(`monstera-${suffix}`)
  })

  it('resuelve filtros de seleccion multiple con parametros repetidos', async () => {
    const response = await request(app).get(
      '/api/products?category=suculentas&category=florales&limit=50',
    )

    expect(response.status).toBe(200)
    const slugs = response.body.items.map((item: { slug: string }) => item.slug)
    expect(slugs).toContain(`echeveria-${suffix}`)
    expect(slugs).toContain(`orquidea-${suffix}`)
    expect(slugs).not.toContain(`monstera-${suffix}`)
  })

  it('busca por texto en nombre y descripcion', async () => {
    const response = await request(app).get('/api/products?q=monstera&limit=50')

    expect(response.status).toBe(200)
    const slugs = response.body.items.map((item: { slug: string }) => item.slug)
    expect(slugs).toContain(`monstera-${suffix}`)
    expect(slugs).not.toContain(`echeveria-${suffix}`)
  })

  it('no interpreta metacaracteres de regex en la busqueda', async () => {
    const response = await request(app).get('/api/products?q=.*&limit=50')

    expect(response.status).toBe(200)
    const slugs = response.body.items.map((item: { slug: string }) => item.slug)
    expect(slugs).not.toContain(`monstera-${suffix}`)
  })

  it('ordena por precio ascendente', async () => {
    const response = await request(app).get(`/api/products?sort=price_asc&q=${suffix}&limit=50`)

    expect(response.status).toBe(200)
    const prices = response.body.items.map((item: { price: number }) => item.price)
    // Los tres productos de esta suite, de menor a mayor precio.
    expect(prices).toEqual([10, 30, 45])
  })

  it('ordena por precio descendente', async () => {
    const response = await request(app).get(`/api/products?sort=price_desc&q=${suffix}&limit=50`)

    expect(response.status).toBe(200)
    const prices = response.body.items.map((item: { price: number }) => item.price)
    expect(prices).toEqual([45, 30, 10])
  })

  it('recupera un producto por slug', async () => {
    const response = await request(app).get(`/api/products/slug/monstera-${suffix}`)

    expect(response.status).toBe(200)
    expect(response.body.slug).toBe(`monstera-${suffix}`)
    expect(response.body.name).toBe('Monstera Deliciosa')
  })

  it('devuelve 404 si el slug no existe', async () => {
    const response = await request(app).get('/api/products/slug/no-existe-esta-planta')
    expect(response.status).toBe(404)
  })
})
