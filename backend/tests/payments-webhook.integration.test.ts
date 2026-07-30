import request from 'supertest'
import { Types } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { connectToDatabase, disconnectDatabase } from '../src/config/db.js'
import { OrderModel } from '../src/modules/orders/schemas/order.schema.js'
import { validShippingAddress } from './fixtures.js'
import { ProductModel } from '../src/modules/products/schemas/product.schema.js'

const stripeMocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  createIntent: vi.fn(),
  retrieveIntent: vi.fn(),
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

import { app } from '../src/app.js'

describe('Payments webhook integration', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
    vi.clearAllMocks()
  })

  it('marks order as paid on payment_intent.succeeded', async () => {
    const userId = new Types.ObjectId()
    const paymentIntentId = `pi_test_paid_${new Types.ObjectId().toHexString()}`

    const order = await OrderModel.create({
      userId,
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: new Types.ObjectId(),
          slug: `webhook-paid-${Date.now()}`,
          name: 'Webhook Paid Product',
          image: 'https://example.com/item.jpg',
          quantity: 1,
          unitPrice: 45000,
          currency: 'COP',
          lineTotal: 45000,
        },
      ],
      subtotal: 45000,
      total: 45000,
      currency: 'COP',
      status: 'pending',
      paymentIntentId,
    })

    stripeMocks.constructEvent.mockReturnValueOnce({
      id: 'evt_test_paid_001',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          metadata: {
            orderId: String(order._id),
          },
        },
      },
    })

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=fake')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_test_paid_001' })

    expect(response.status).toBe(200)
    expect(response.body.data.received).toBe(true)
    expect(response.body.data.eventType).toBe('payment_intent.succeeded')

    const updatedOrder = await OrderModel.findById(order._id).lean()
    expect(updatedOrder?.status).toBe('paid')
    expect(updatedOrder?.paymentIntentId).toBe(paymentIntentId)
    expect(updatedOrder?.paidAt).toBeTruthy()
    expect(updatedOrder?.paymentLastError).toBeFalsy()
  })

  it('marks order as failed on payment_intent.payment_failed', async () => {
    const userId = new Types.ObjectId()
    const paymentIntentId = `pi_test_failed_${new Types.ObjectId().toHexString()}`

    const order = await OrderModel.create({
      userId,
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: new Types.ObjectId(),
          slug: `webhook-failed-${Date.now()}`,
          name: 'Webhook Failed Product',
          image: 'https://example.com/item.jpg',
          quantity: 1,
          unitPrice: 51000,
          currency: 'COP',
          lineTotal: 51000,
        },
      ],
      subtotal: 51000,
      total: 51000,
      currency: 'COP',
      status: 'pending',
      paymentIntentId,
    })

    stripeMocks.constructEvent.mockReturnValueOnce({
      id: 'evt_test_failed_001',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: paymentIntentId,
          metadata: {
            orderId: String(order._id),
          },
          last_payment_error: {
            message: 'Card was declined',
          },
        },
      },
    })

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=fake')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_test_failed_001' })

    expect(response.status).toBe(200)
    expect(response.body.data.eventType).toBe('payment_intent.payment_failed')

    const updatedOrder = await OrderModel.findById(order._id).lean()
    expect(updatedOrder?.status).toBe('failed')
    expect(updatedOrder?.paymentIntentId).toBe(paymentIntentId)
    expect(updatedOrder?.paymentLastError).toBe('Card was declined')
  })

  it('returns 400 when webhook signature is invalid', async () => {
    stripeMocks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=invalid')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_invalid_signature' })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid webhook signature')
  })

  it('marks order as canceled on payment_intent.canceled', async () => {
    const userId = new Types.ObjectId()
    const paymentIntentId = `pi_test_canceled_${new Types.ObjectId().toHexString()}`

    const order = await OrderModel.create({
      userId,
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: new Types.ObjectId(),
          slug: `webhook-canceled-${Date.now()}`,
          name: 'Webhook Canceled Product',
          image: 'https://example.com/item.jpg',
          quantity: 1,
          unitPrice: 47000,
          currency: 'COP',
          lineTotal: 47000,
        },
      ],
      subtotal: 47000,
      total: 47000,
      currency: 'COP',
      status: 'pending',
      paymentIntentId,
    })

    stripeMocks.constructEvent.mockReturnValueOnce({
      id: 'evt_test_canceled_001',
      type: 'payment_intent.canceled',
      data: {
        object: {
          id: paymentIntentId,
          metadata: {
            orderId: String(order._id),
          },
        },
      },
    })

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=fake')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_test_canceled_001' })

    expect(response.status).toBe(200)
    expect(response.body.data.eventType).toBe('payment_intent.canceled')

    const updatedOrder = await OrderModel.findById(order._id).lean()
    expect(updatedOrder?.status).toBe('canceled')
    expect(updatedOrder?.paymentIntentId).toBe(paymentIntentId)
    expect(updatedOrder?.paymentLastError).toBe('Payment canceled')
  })
  it('descuenta el stock de los productos al confirmarse el pago', async () => {
    const userId = new Types.ObjectId()
    const paymentIntentId = `pi_test_stock_${new Types.ObjectId().toHexString()}`

    const product = await ProductModel.create({
      slug: `webhook-stock-${Date.now()}`,
      name: 'Producto Con Stock',
      description: 'Producto para validar el decremento de stock',
      price: 20,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: false,
      isFeatured: false,
      stock: 10,
      isActive: true,
      images: [{ url: 'https://example.com/p.jpg', alt: 'Producto' }],
      tags: [],
    })

    const order = await OrderModel.create({
      userId,
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: 'https://example.com/p.jpg',
          quantity: 3,
          unitPrice: 20,
          currency: 'EUR',
          lineTotal: 60,
        },
      ],
      subtotal: 60,
      total: 60,
      currency: 'EUR',
      status: 'pending',
      paymentIntentId,
    })

    stripeMocks.constructEvent.mockReturnValueOnce({
      id: 'evt_test_stock_001',
      type: 'payment_intent.succeeded',
      data: { object: { id: paymentIntentId, metadata: { orderId: String(order._id) } } },
    })

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=fake')
      .set('Content-Type', 'application/json')
      .send({ id: 'evt_test_stock_001' })

    expect(response.status).toBe(200)

    const updatedProduct = await ProductModel.findById(product._id).lean()
    expect(updatedProduct?.stock).toBe(7)

    const updatedOrder = await OrderModel.findById(order._id).lean()
    expect(updatedOrder?.status).toBe('paid')
  })

  it('ignora la reentrega del mismo evento y no descuenta stock dos veces', async () => {
    const userId = new Types.ObjectId()
    const paymentIntentId = `pi_test_dup_${new Types.ObjectId().toHexString()}`
    const eventId = `evt_test_duplicate_${Date.now()}`

    const product = await ProductModel.create({
      slug: `webhook-dup-${Date.now()}`,
      name: 'Producto Duplicado',
      description: 'Producto para validar la idempotencia del webhook',
      price: 20,
      currency: 'EUR',
      category: 'test',
      careLevel: 'easy',
      lightLevel: 'medium',
      size: 'm',
      petFriendly: false,
      isFeatured: false,
      stock: 10,
      isActive: true,
      images: [{ url: 'https://example.com/p.jpg', alt: 'Producto' }],
      tags: [],
    })

    const order = await OrderModel.create({
      userId,
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: 'https://example.com/p.jpg',
          quantity: 2,
          unitPrice: 20,
          currency: 'EUR',
          lineTotal: 40,
        },
      ],
      subtotal: 40,
      total: 40,
      currency: 'EUR',
      status: 'pending',
      paymentIntentId,
    })

    const buildEvent = () => ({
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: { id: paymentIntentId, metadata: { orderId: String(order._id) } } },
    })

    const send = () =>
      request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 't=123,v1=fake')
        .set('Content-Type', 'application/json')
        .send({ id: eventId })

    stripeMocks.constructEvent.mockReturnValueOnce(buildEvent())
    const first = await send()
    expect(first.status).toBe(200)
    expect(first.body.data.duplicate).toBe(false)

    // Stripe reintenta la entrega del MISMO evento.
    stripeMocks.constructEvent.mockReturnValueOnce(buildEvent())
    const second = await send()
    expect(second.status).toBe(200)
    expect(second.body.data.duplicate).toBe(true)

    // El stock se descuenta una sola vez.
    const updatedProduct = await ProductModel.findById(product._id).lean()
    expect(updatedProduct?.stock).toBe(8)
  })
})
