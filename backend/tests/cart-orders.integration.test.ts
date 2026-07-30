import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { connectToDatabase, disconnectDatabase } from '../src/config/db.js'
import { ProductModel } from '../src/modules/products/schemas/product.schema.js'
import { createOrderBody, validShippingAddress } from './fixtures.js'

describe('Cart and orders integration', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('rejects cart access without token', async () => {
    const response = await request(app).get('/api/cart')
    expect(response.status).toBe(401)
  })

  it('supports cart CRUD and order creation', async () => {
    const timestamp = Date.now()

    const product = await ProductModel.create({
      slug: `test-product-${timestamp}`,
      name: 'Test Product',
      description: 'Product for integration tests',
      price: 25000,
      currency: 'COP',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: true,
      isFeatured: false,
      stock: 50,
      isActive: true,
      images: [{ url: 'https://example.com/product.jpg', alt: 'Test Product' }],
      tags: ['test'],
    })

    const email = `test.cart.orders.${timestamp}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Cart Order Test',
      email,
      password,
    })

    expect(register.status).toBe(201)

    const accessToken = register.body.data.accessToken as string

    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: String(product._id), quantity: 2 })

    expect(addItem.status).toBe(200)
    expect(addItem.body.data.items).toHaveLength(1)
    expect(addItem.body.data.totalItems).toBe(2)

    const updateItem = await request(app)
      .patch(`/api/cart/items/${String(product._id)}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ quantity: 3 })

    expect(updateItem.status).toBe(200)
    expect(updateItem.body.data.items[0].quantity).toBe(3)

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createOrderBody)

    expect(createOrder.status).toBe(201)
    expect(createOrder.body.data.status).toBe('pending')
    expect(createOrder.body.data.items).toHaveLength(1)

    const createdOrderId = createOrder.body.data.id as string

    const listOrders = await request(app)
      .get('/api/orders?page=1&limit=10&includePending=true')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(listOrders.status).toBe(200)
    expect(listOrders.body.data.page).toBe(1)
    expect(listOrders.body.data.limit).toBe(10)
    expect(
      listOrders.body.data.items.some((order: { id: string }) => order.id === createdOrderId),
    ).toBe(true)

    const orderDetail = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(orderDetail.status).toBe(200)
    expect(orderDetail.body.data.id).toBe(createdOrderId)

    const cartAfterOrder = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(cartAfterOrder.status).toBe(200)
    expect(cartAfterOrder.body.data.items).toHaveLength(1)

    const defaultOrdersList = await request(app)
      .get('/api/orders?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(defaultOrdersList.status).toBe(200)
    expect(
      defaultOrdersList.body.data.items.some(
        (order: { id: string }) => order.id === createdOrderId,
      ),
    ).toBe(false)

    const invalidPagination = await request(app)
      .get('/api/orders?page=0&limit=100')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(invalidPagination.status).toBe(400)
  })

  it('usa el precio actual del catalogo, no el congelado en el carrito', async () => {
    const timestamp = Date.now()

    const product = await ProductModel.create({
      slug: `reprice-product-${timestamp}`,
      name: 'Reprice Product',
      description: 'Producto para validar la revalidacion de precios',
      price: 10,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: true,
      isFeatured: false,
      stock: 50,
      isActive: true,
      images: [{ url: 'https://example.com/reprice.jpg', alt: 'Reprice Product' }],
      tags: ['test'],
    })

    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Reprice Test',
        email: `test.reprice.${timestamp}@example.com`,
        password: 'Password123!',
      })

    expect(register.status).toBe(201)
    const accessToken = register.body.data.accessToken as string

    // El carrito congela unitPrice = 10 en el momento de anadir el producto.
    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: String(product._id), quantity: 2 })

    expect(addItem.status).toBe(200)
    expect(addItem.body.data.total).toBe(20)

    // El catalogo sube de precio despues de que el usuario llenara el carrito.
    await ProductModel.updateOne({ _id: product._id }, { $set: { price: 15 } })

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createOrderBody)

    expect(createOrder.status).toBe(201)
    expect(createOrder.body.data.items[0].unitPrice).toBe(15)
    expect(createOrder.body.data.items[0].lineTotal).toBe(30)
    expect(createOrder.body.data.subtotal).toBe(30)
    expect(createOrder.body.data.total).toBe(30)
  })

  it('rechaza el pedido si un producto del carrito ya no existe', async () => {
    const timestamp = Date.now()

    const product = await ProductModel.create({
      slug: `removed-product-${timestamp}`,
      name: 'Removed Product',
      description: 'Producto que se elimina antes de crear el pedido',
      price: 30,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'low',
      size: 's',
      petFriendly: false,
      isFeatured: false,
      stock: 50,
      isActive: true,
      images: [{ url: 'https://example.com/removed.jpg', alt: 'Removed Product' }],
      tags: ['test'],
    })

    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Removed Product Test',
        email: `test.removed.${timestamp}@example.com`,
        password: 'Password123!',
      })

    expect(register.status).toBe(201)
    const accessToken = register.body.data.accessToken as string

    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: String(product._id), quantity: 1 })

    expect(addItem.status).toBe(200)

    await ProductModel.deleteOne({ _id: product._id })

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createOrderBody)

    expect(createOrder.status).toBe(409)
    expect(createOrder.body.message).toContain('ya no están disponibles')
  })
})

describe('Direccion de envio', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  const prepareCart = async (label: string) => {
    const timestamp = Date.now()
    const product = await ProductModel.create({
      slug: `envio-${label}-${timestamp}`,
      name: 'Producto Envio',
      description: 'Producto para tests de direccion de envio',
      price: 15,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: false,
      isFeatured: false,
      stock: 20,
      isActive: true,
      images: [{ url: 'https://example.com/envio.jpg', alt: 'Producto Envio' }],
      tags: [],
    })

    const register = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Envio Test',
        email: `test.envio.${label}.${timestamp}@example.com`,
        password: 'Password123!',
      })

    const accessToken = register.body.data.accessToken as string

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: String(product._id), quantity: 1 })

    return accessToken
  }

  it('rechaza el pedido sin direccion de envio', async () => {
    const accessToken = await prepareCart('sin')

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('Direccion de envio no valida')
  })

  it('rechaza un codigo postal que no tenga 5 digitos', async () => {
    const accessToken = await prepareCart('cp')

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        shippingAddress: { ...validShippingAddress, postalCode: '281' },
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('código postal')
  })

  it('persiste la direccion y la devuelve en el detalle del pedido', async () => {
    const accessToken = await prepareCart('ok')

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createOrderBody)

    expect(created.status).toBe(201)
    expect(created.body.data.shippingAddress).toMatchObject({
      fullName: validShippingAddress.fullName,
      city: 'Madrid',
      postalCode: '28013',
      country: 'ES',
    })

    const detail = await request(app)
      .get(`/api/orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(detail.status).toBe(200)
    expect(detail.body.data.shippingAddress.line1).toBe(validShippingAddress.line1)
  })
})
