import Stripe from 'stripe'
import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { logger } from '../../../config/logger'
import { env } from '../../../config/env'
import { createPaymentIntentSchema } from '../dto/payments.dto'
import { OrderModel } from '../../orders/schemas/order.schema'
import { CartModel } from '../../cart/schemas/cart.schema'

export class PaymentService {
  private readonly stripe: Stripe | null

  constructor() {
    this.stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null
  }

  async createPaymentIntent(userId: string, rawBody: unknown) {
    const stripe = this.getStripeClient()
    const parsed = createPaymentIntentSchema.safeParse(rawBody)
    if (!parsed.success) {
      logger.warn({ userId }, 'Payment intent failed: invalid payload')
      throw new HttpError(400, 'Invalid payload for payment intent')
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpError(401, 'Unauthorized')
    }

    if (!Types.ObjectId.isValid(parsed.data.orderId)) {
      throw new HttpError(400, 'Invalid order id')
    }

    const order = await OrderModel.findOne({
      _id: new Types.ObjectId(parsed.data.orderId),
      userId: new Types.ObjectId(userId),
    })

    if (!order) {
      logger.warn({ userId, orderId: parsed.data.orderId }, 'Payment intent failed: order not found')
      throw new HttpError(404, 'Order not found')
    }

    if (order.status === 'paid') {
      logger.info({ userId, orderId: String(order._id) }, 'Payment intent blocked: order already paid')
      throw new HttpError(409, 'Order is already paid')
    }

    if (order.status === 'canceled') {
      logger.info({ userId, orderId: String(order._id) }, 'Payment intent blocked: order canceled')
      throw new HttpError(409, 'Order was canceled and cannot be paid')
    }

    const existingIntentResult = await this.getExistingIntentState(stripe, order.paymentIntentId ?? undefined)

    if (existingIntentResult?.alreadyPaid) {
      order.status = 'paid'
      order.paidAt = order.paidAt ?? new Date()
      order.paymentLastError = undefined
      await order.save()
      await this.clearUserCart(order.userId)

      logger.info({ userId, orderId: String(order._id), paymentIntentId: order.paymentIntentId }, 'Payment intent resolved: already paid in Stripe')

      throw new HttpError(409, 'Order is already paid')
    }

    if (existingIntentResult?.intent) {
      const existingIntent = existingIntentResult.intent
      if (!existingIntent.client_secret) {
        throw new HttpError(500, 'Unable to initialize payment flow')
      }

      return {
        orderId: String(order._id),
        status: order.status,
        currency: order.currency,
        total: order.total,
        paymentIntentId: existingIntent.id,
        clientSecret: existingIntent.client_secret,
      }
    }

    const amount = this.toMinorUnit(order.total)
    if (amount <= 0) {
      throw new HttpError(400, 'Order amount must be greater than zero')
    }

    const currency = order.currency.toLowerCase()
    const idempotencyKey = parsed.data.idempotencyKey ?? `order-${String(order._id)}-amount-${amount}-create-intent`

    let intent: Stripe.PaymentIntent

    try {
      intent = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId: String(order._id),
            userId: String(order.userId),
          },
        },
        {
          idempotencyKey,
        },
      )
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        logger.warn(
          {
            userId,
            orderId: String(order._id),
            code: error.code,
            type: error.type,
          },
          'Payment intent creation failed with Stripe error',
        )
        throw new HttpError(400, error.message || 'Unable to initialize payment flow')
      }

      throw error
    }

    if (!intent.client_secret) {
      throw new HttpError(500, 'Unable to initialize payment flow')
    }

    order.paymentIntentId = intent.id
    order.paymentLastError = undefined
    order.status = 'pending'
    await order.save()

    logger.info(
      {
        userId,
        orderId: String(order._id),
        paymentIntentId: intent.id,
        amountMinor: amount,
        currency,
      },
      'Payment intent created',
    )

    return {
      orderId: String(order._id),
      status: order.status,
      currency: order.currency,
      total: order.total,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.getStripeClient()

    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new HttpError(500, 'Stripe webhook is not configured')
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
    } catch {
      logger.warn('Stripe webhook rejected: invalid signature')
      throw new HttpError(400, 'Invalid webhook signature')
    }

    logger.info({ eventType: event.type, eventId: event.id }, 'Stripe webhook received')

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        await this.markOrderAsPaid(intent)
        break
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        await this.markOrderAsFailed(intent)
        break
      }
      case 'payment_intent.canceled': {
        const intent = event.data.object as Stripe.PaymentIntent
        await this.markOrderAsCanceled(intent)
        break
      }
      default:
        break
    }

    return {
      received: true,
      eventType: event.type,
    }
  }

  private async getExistingIntentState(stripe: Stripe, paymentIntentId?: string) {
    if (!paymentIntentId) {
      return null
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (intent.status === 'succeeded') {
        return {
          alreadyPaid: true,
        }
      }

      if (intent.status === 'canceled') {
        return null
      }

      return {
        alreadyPaid: false,
        intent,
      }
    } catch {
      return null
    }
  }

  private async markOrderAsPaid(intent: Stripe.PaymentIntent) {
    const order = await this.findOrderByIntent(intent)
    if (!order) {
      return
    }

    if (order.status === 'paid') {
      return
    }

    order.status = 'paid'
    order.paymentIntentId = intent.id
    order.paymentLastError = undefined
    order.paidAt = order.paidAt ?? new Date()
    await order.save()
    await this.clearUserCart(order.userId)

    logger.info(
      {
        orderId: String(order._id),
        userId: String(order.userId),
        paymentIntentId: intent.id,
      },
      'Order marked as paid from webhook',
    )
  }

  private async markOrderAsFailed(intent: Stripe.PaymentIntent) {
    const order = await this.findOrderByIntent(intent)
    if (!order) {
      return
    }

    if (order.status === 'paid') {
      return
    }

    order.status = 'failed'
    order.paymentIntentId = intent.id
    order.paymentLastError = intent.last_payment_error?.message ?? 'Payment failed'
    await order.save()

    logger.warn(
      {
        orderId: String(order._id),
        userId: String(order.userId),
        paymentIntentId: intent.id,
        lastError: order.paymentLastError,
      },
      'Order marked as failed from webhook',
    )
  }

  private async markOrderAsCanceled(intent: Stripe.PaymentIntent) {
    const order = await this.findOrderByIntent(intent)
    if (!order) {
      return
    }

    if (order.status === 'paid') {
      return
    }

    order.status = 'canceled'
    order.paymentIntentId = intent.id
    order.paymentLastError = 'Payment canceled'
    await order.save()

    logger.warn(
      {
        orderId: String(order._id),
        userId: String(order.userId),
        paymentIntentId: intent.id,
      },
      'Order marked as canceled from webhook',
    )
  }

  private async findOrderByIntent(intent: Stripe.PaymentIntent) {
    const byIntentId = await OrderModel.findOne({ paymentIntentId: intent.id })
    if (byIntentId) {
      return byIntentId
    }

    const metadataOrderId = intent.metadata?.orderId
    if (!metadataOrderId || !Types.ObjectId.isValid(metadataOrderId)) {
      return null
    }

    return OrderModel.findById(new Types.ObjectId(metadataOrderId))
  }

  private getStripeClient() {
    if (!this.stripe) {
      throw new HttpError(500, 'Stripe is not configured')
    }

    return this.stripe
  }

  private toMinorUnit(total: number) {
    return Math.round((total + Number.EPSILON) * 100)
  }

  private async clearUserCart(userId: Types.ObjectId) {
    const cart = await CartModel.findOne({ userId })
    if (!cart || cart.items.length === 0) {
      return
    }

    cart.items.splice(0, cart.items.length)
    cart.subtotal = 0
    cart.total = 0
    await cart.save()
  }
}
