import Stripe from 'stripe'
import { Types, type ClientSession } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error.js'
import { logger } from '../../../config/logger.js'
import { env } from '../../../config/env.js'
import { withOptionalTransaction } from '../../../config/transactions.js'
import { createPaymentIntentSchema } from '../dto/payments.dto.js'
import { OrderModel } from '../../orders/schemas/order.schema.js'
import { CartModel } from '../../cart/schemas/cart.schema.js'
import { ProductModel } from '../../products/schemas/product.schema.js'
import { ProcessedWebhookEventModel } from '../schemas/processed-webhook-event.schema.js'
import { UserModel } from '../../auth/schemas/user.schema.js'
import { EmailService } from '../../notifications/services/email.service.js'

export class PaymentService {
  private readonly stripe: Stripe | null

  constructor(private readonly emailService: EmailService = new EmailService()) {
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
      logger.warn(
        { userId, orderId: parsed.data.orderId },
        'Payment intent failed: order not found',
      )
      throw new HttpError(404, 'Order not found')
    }

    if (order.status === 'paid') {
      logger.info(
        { userId, orderId: String(order._id) },
        'Payment intent blocked: order already paid',
      )
      throw new HttpError(409, 'Order is already paid')
    }

    if (order.status === 'canceled') {
      logger.info({ userId, orderId: String(order._id) }, 'Payment intent blocked: order canceled')
      throw new HttpError(409, 'Order was canceled and cannot be paid')
    }

    const existingIntentResult = await this.getExistingIntentState(
      stripe,
      order.paymentIntentId ?? undefined,
    )

    if (existingIntentResult?.alreadyPaid) {
      order.status = 'paid'
      order.paidAt = order.paidAt ?? new Date()
      order.paymentLastError = undefined
      await order.save()
      await this.clearUserCart(order.userId)

      logger.info(
        { userId, orderId: String(order._id), paymentIntentId: order.paymentIntentId },
        'Payment intent resolved: already paid in Stripe',
      )

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
    const idempotencyKey =
      parsed.data.idempotencyKey ?? `order-${String(order._id)}-amount-${amount}-create-intent`

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

    const isNewEvent = await this.registerWebhookEvent(event.id, event.type)
    if (!isNewEvent) {
      logger.info({ eventId: event.id, eventType: event.type }, 'Stripe webhook ignored: duplicate')
      return {
        received: true,
        eventType: event.type,
        duplicate: true,
      }
    }

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
      duplicate: false,
    }
  }

  private async registerWebhookEvent(eventId: string, type: string): Promise<boolean> {
    try {
      await ProcessedWebhookEventModel.create({ eventId, type })
      return true
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        return false
      }

      throw error
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

    const orderId = String(order._id)
    const userId = order.userId
    const paidAt = order.paidAt ?? new Date()

    await withOptionalTransaction(async (session) => {
      // Actualizacion atomica en vez de mutar y guardar el documento ya cargado:
      // withTransaction reintenta el callback ante errores transitorios, y en el
      // segundo intento un order.save() no escribiria nada (Mongoose ya limpio
      // los campos modificados en el primer intento). La transaccion commitearia
      // sin marcar el pedido como pagado y el webhook devolveria 200 igualmente.
      await OrderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            status: 'paid',
            paymentIntentId: intent.id,
            paidAt,
          },
          $unset: { paymentLastError: '' },
        },
        { session },
      )

      for (const item of order.items) {
        const result = await ProductModel.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        )

        if (result.matchedCount === 0) {
          logger.error(
            {
              orderId,
              productId: String(item.productId),
              quantity: item.quantity,
            },
            'Stock decrement skipped: insufficient stock at payment confirmation',
          )
        }
      }

      await this.clearUserCart(userId, session)
    })

    logger.info(
      {
        orderId,
        userId: String(userId),
        paymentIntentId: intent.id,
        itemsCount: order.items.length,
      },
      'Order marked as paid from webhook',
    )

    void this.sendConfirmationEmail(order)
  }

  private async sendConfirmationEmail(order: {
    _id: unknown
    userId: unknown
    total: number
    currency: string
    items: Array<{
      name: string
      quantity: number
      unitPrice: number
      currency: string
      lineTotal: number
    }>
    shippingAddress?: {
      fullName: string
      line1: string
      line2?: string | null
      city: string
      postalCode: string
      province: string
      country: string
      phone: string
    } | null
  }) {
    try {
      const user = await UserModel.findById(order.userId).select({ email: 1 }).lean()
      if (!user?.email) {
        return
      }

      await this.emailService.sendOrderConfirmation({
        to: user.email,
        orderId: String(order._id),
        total: order.total,
        currency: order.currency,
        items: order.items,
        shippingAddress: order.shippingAddress,
      })
    } catch (error) {
      logger.error(
        {
          orderId: String(order._id),
          error: error instanceof Error ? error.message : 'desconocido',
        },
        'Failed to dispatch order confirmation email',
      )
    }
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

  private async clearUserCart(userId: Types.ObjectId, session?: ClientSession) {
    const cart = await CartModel.findOne({ userId }).session(session ?? null)
    if (!cart || cart.items.length === 0) {
      return
    }

    cart.items.splice(0, cart.items.length)
    cart.subtotal = 0
    cart.total = 0
    await cart.save({ session })
  }
}
