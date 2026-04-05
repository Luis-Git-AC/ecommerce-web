import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { ProductModel } from '../src/modules/products/schemas/product.schema'

const stripeMocks = vi.hoisted(() => ({
  createIntent: vi.fn(),
  retrieveIntent: vi.fn(),
  constructEvent: vi.fn(),
}))

vi.mock('stripe', () => {
  class StripeMock {
    webhooks = {
      constructEvent: stripeMocks.constructEvent,
    }

    paymentIntents = {
      create: stripeMocks.createIntent,
      retrieve: stripeMocks.retrieveIntent,
    }
  }

  return {
    default: StripeMock,
  }
})

import { app } from '../src/app'

describe('Payments intent integration', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
    vi.clearAllMocks()
  })

  it('creates a payment intent for a pending order', async () => {
    const timestamp = Date.now()

    stripeMocks.retrieveIntent.mockRejectedValueOnce(new Error('Not found'))
    stripeMocks.createIntent.mockResolvedValueOnce({
      id: `pi_test_${timestamp}`,
      client_secret: `pi_test_${timestamp}_secret_demo`,
      status: 'requires_payment_method',
    })

    const product = await ProductModel.create({
      slug: `test-payment-product-${timestamp}`,
      name: 'Payment Intent Product',
      description: 'Product for payment intent integration test',
      price: 32000,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: true,
      isFeatured: false,
      images: [{ url: 'https://example.com/product.jpg', alt: 'Payment Intent Product' }],
      tags: ['test'],
    })

    const email = `test.payment.intent.${timestamp}@example.com`
    const password = 'Password123!'

    const register = await request(app).post('/api/auth/register').send({
      name: 'Payment Intent Test',
      email,
      password,
    })

    expect(register.status).toBe(201)

    const accessToken = register.body.data.accessToken as string

    const addItem = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ productId: String(product._id), quantity: 1 })

    expect(addItem.status).toBe(200)

    const createOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(createOrder.status).toBe(201)

    const orderId = createOrder.body.data.id as string

    const createIntent = await request(app)
      .post('/api/payments/intents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId })

    expect(createIntent.status).toBe(200)
    expect(createIntent.body.data.orderId).toBe(orderId)
    expect(createIntent.body.data.paymentIntentId).toBe(`pi_test_${timestamp}`)
    expect(createIntent.body.data.clientSecret).toBe(`pi_test_${timestamp}_secret_demo`)
    expect(stripeMocks.createIntent).toHaveBeenCalledTimes(1)
  })
})
