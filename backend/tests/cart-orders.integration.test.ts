import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { ProductModel } from '../src/modules/products/schemas/product.schema'

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

    expect(createOrder.status).toBe(201)
    expect(createOrder.body.data.status).toBe('pending')
    expect(createOrder.body.data.items).toHaveLength(1)

    const createdOrderId = createOrder.body.data.id as string

    const listOrders = await request(app)
      .get('/api/orders?page=1&limit=10')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(listOrders.status).toBe(200)
    expect(listOrders.body.data.page).toBe(1)
    expect(listOrders.body.data.limit).toBe(10)
    expect(listOrders.body.data.items.some((order: { id: string }) => order.id === createdOrderId)).toBe(true)

    const orderDetail = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(orderDetail.status).toBe(200)
    expect(orderDetail.body.data.id).toBe(createdOrderId)

    const cartAfterOrder = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(cartAfterOrder.status).toBe(200)
    expect(cartAfterOrder.body.data.items).toHaveLength(0)

    const invalidPagination = await request(app)
      .get('/api/orders?page=0&limit=100')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(invalidPagination.status).toBe(400)
  })
})
