import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { connectToDatabase, disconnectDatabase, isDatabaseReady } from '../src/config/db.js'
import { supportsTransactions } from '../src/config/transactions.js'
import { ProductModel } from '../src/modules/products/schemas/product.schema.js'
import { createOrderBody } from './fixtures.js'

const suffix = `s${Date.now()}`

const createProduct = (overrides: Record<string, unknown>) =>
  ProductModel.create({
    description: 'Producto para tests de inventario',
    currency: 'EUR',
    category: 'test',
    careLevel: 'easy',
    lightLevel: 'medium',
    size: 'm',
    petFriendly: false,
    isFeatured: false,
    isActive: true,
    images: [{ url: 'https://example.com/p.jpg', alt: 'Producto' }],
    tags: [],
    ...overrides,
  })

const registerUser = async (label: string) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: `Stock ${label}`,
      email: `test.stock.${label}.${suffix}@example.com`,
      password: 'Password123!',
    })

  expect(response.status).toBe(201)
  return response.body.data.accessToken as string
}

describe('Inventario', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await ProductModel.deleteMany({ slug: { $regex: `-${suffix}$` } })
    await disconnectDatabase()
  })

  it('rechaza anadir al carrito mas unidades de las disponibles', async () => {
    const product = await createProduct({
      slug: `limitado-${suffix}`,
      name: 'Planta Limitada',
      price: 20,
      stock: 3,
    })
    const token = await registerUser('limite')

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 5 })

    expect(response.status).toBe(409)
    expect(response.body.message).toContain('Solo quedan 3 unidades disponibles')
  })

  it('rechaza un producto agotado', async () => {
    const product = await createProduct({
      slug: `agotado-${suffix}`,
      name: 'Planta Agotada',
      price: 20,
      stock: 0,
    })
    const token = await registerUser('agotado')

    const response = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 })

    expect(response.status).toBe(409)
    expect(response.body.message).toContain('está agotado')
  })

  it('acumula cantidades y valida sobre el total resultante', async () => {
    const product = await createProduct({
      slug: `acumula-${suffix}`,
      name: 'Planta Acumulada',
      price: 20,
      stock: 4,
    })
    const token = await registerUser('acumula')

    const first = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 3 })
    expect(first.status).toBe(200)

    // 3 + 2 = 5 supera las 4 unidades disponibles.
    const second = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 2 })

    expect(second.status).toBe(409)
    expect(second.body.message).toContain('Solo quedan 4 unidades disponibles')
  })

  it('no permite crear el pedido si el stock cae por debajo tras llenar el carrito', async () => {
    const product = await createProduct({
      slug: `cae-${suffix}`,
      name: 'Planta Escasa',
      price: 20,
      stock: 10,
    })
    const token = await registerUser('cae')

    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 8 })
    expect(addItem.status).toBe(200)

    // Otro cliente agota casi todo antes de que este confirme.
    await ProductModel.updateOne({ _id: product._id }, { $set: { stock: 2 } })

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(createOrderBody)

    expect(createOrder.status).toBe(409)
    expect(createOrder.body.message).toContain('No hay stock suficiente')
  })

  it('oculta los productos dados de baja en el catalogo publico', async () => {
    const product = await createProduct({
      slug: `inactivo-${suffix}`,
      name: 'Planta Retirada',
      price: 20,
      stock: 5,
      isActive: false,
    })

    const listing = await request(app).get('/api/products?limit=50&q=Planta Retirada')
    const slugs = listing.body.items.map((item: { slug: string }) => item.slug)
    expect(slugs).not.toContain(`inactivo-${suffix}`)

    const detail = await request(app).get(`/api/products/${String(product._id)}`)
    expect(detail.status).toBe(404)

    const bySlug = await request(app).get(`/api/products/slug/inactivo-${suffix}`)
    expect(bySlug.status).toBe(404)
  })
})

describe('Soporte de transacciones', () => {
  // Este describe se ejecuta despues de que el anterior haya llamado a
  // disconnectDatabase(), asi que tambien cubre como regresion la reconexion:
  // connectToDatabase() devolvia una connectionPromise ya resuelta y no volvia
  // a conectar nunca, dejando el proceso operando sobre una conexion muerta.
  beforeAll(async () => {
    await connectToDatabase()
  })

  it('reconecta correctamente despues de una desconexion', () => {
    expect(isDatabaseReady()).toBe(true)
  })

  it('el entorno de test expone replica set, asi que las transacciones se ejecutan de verdad', async () => {
    // Si esto fallara, markOrderAsPaid estaria degradando a ejecucion sin
    // sesion y los tests de pago no probarian la atomicidad real.
    await expect(supportsTransactions()).resolves.toBe(true)
  })
})
