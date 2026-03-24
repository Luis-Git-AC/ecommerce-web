import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { logger } from '../../../config/logger'
import { CartModel } from '../../cart/schemas/cart.schema'
import { listOrdersQuerySchema } from '../dto/orders.dto'
import { OrderModel } from '../schemas/order.schema'

export class OrderService {
  async createOrder(userId: string) {
    const objectUserId = this.toObjectId(userId)

    const cart = await CartModel.findOne({ userId: objectUserId })
    if (!cart || cart.items.length === 0) {
      logger.warn({ userId }, 'Order create failed: cart is empty')
      throw new HttpError(400, 'Cart is empty')
    }

    const currency = cart.items[0]?.currency ?? 'EUR'
    const orderPayload = {
      items: cart.items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      subtotal: cart.subtotal,
      total: cart.total,
      currency,
      status: 'pending' as const,
      paymentIntentId: undefined,
      paymentLastError: undefined,
      paidAt: undefined,
    }

    const existingPending = await OrderModel.findOne({
      userId: objectUserId,
      status: 'pending',
    }).sort({ createdAt: -1 })

    if (existingPending) {
      existingPending.set({
        items: orderPayload.items,
        subtotal: orderPayload.subtotal,
        total: orderPayload.total,
        currency: orderPayload.currency,
        status: orderPayload.status,
        paymentIntentId: undefined,
        paymentLastError: undefined,
        paidAt: undefined,
      })
      await existingPending.save()

      logger.info(
        {
          userId,
          orderId: String(existingPending._id),
          total: existingPending.total,
          currency: existingPending.currency,
          itemsCount: existingPending.items.length,
        },
        'Order updated existing pending',
      )

      return this.toOrderDetailResponse(existingPending)
    }

    const created = await OrderModel.create({
      userId: objectUserId,
      ...orderPayload,
    })

    logger.info(
      {
        userId,
        orderId: String(created._id),
        total: created.total,
        currency: created.currency,
        itemsCount: created.items.length,
      },
      'Order created',
    )

    return this.toOrderDetailResponse(created)
  }

  async listOrders(userId: string, rawQuery: unknown) {
    const objectUserId = this.toObjectId(userId)
    const parsed = listOrdersQuerySchema.safeParse(rawQuery)

    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query params for orders listing')
    }

    const { page, limit, includePending } = parsed.data
    const query = includePending
      ? { userId: objectUserId }
      : { userId: objectUserId, status: { $ne: 'pending' } }

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ])

    return {
      items: orders.map((order) => ({
        id: String(order._id),
        status: order.status,
        currency: order.currency,
        total: order.total,
        totalItems: order.items.reduce((acc, item) => acc + item.quantity, 0),
        createdAt: order.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async getOrderById(userId: string, orderId: string) {
    const objectUserId = this.toObjectId(userId)

    if (!Types.ObjectId.isValid(orderId)) {
      throw new HttpError(400, 'Invalid order id')
    }

    const order = await OrderModel.findOne({
      _id: new Types.ObjectId(orderId),
      userId: objectUserId,
    }).lean()

    if (!order) {
      throw new HttpError(404, 'Order not found')
    }

    return this.toOrderDetailResponse(order)
  }

  private toObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new HttpError(401, 'Unauthorized')
    }

    return new Types.ObjectId(value)
  }

  private toOrderDetailResponse(order: {
    _id: unknown
    userId: unknown
    status: 'pending' | 'paid' | 'failed' | 'canceled'
    currency: string
    subtotal: number
    total: number
    paymentIntentId?: string | null
    paymentLastError?: string | null
    paidAt?: Date | null
    items: Array<{
      productId: unknown
      slug: string
      name: string
      image: string
      quantity: number
      unitPrice: number
      currency: string
      lineTotal: number
    }>
    createdAt: Date
    updatedAt: Date
  }) {
    return {
      id: String(order._id),
      userId: String(order.userId),
      status: order.status,
      currency: order.currency,
      subtotal: order.subtotal,
      total: order.total,
      paymentIntentId: order.paymentIntentId ?? undefined,
      paymentLastError: order.paymentLastError ?? undefined,
      paidAt: order.paidAt ?? undefined,
      items: order.items.map((item) => ({
        productId: String(item.productId),
        slug: item.slug,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }
}
