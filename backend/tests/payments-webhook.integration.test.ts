import request from 'supertest'
import { Types } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { connectToDatabase, disconnectDatabase } from '../src/config/db'
import { OrderModel } from '../src/modules/orders/schemas/order.schema'

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

import { app } from '../src/app'

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
})
