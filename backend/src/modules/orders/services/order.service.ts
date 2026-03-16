import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { CartModel } from '../../cart/schemas/cart.schema'
import { listOrdersQuerySchema } from '../dto/orders.dto'
import { OrderModel } from '../schemas/order.schema'

export class OrderService {
  async createOrder(userId: string) {
    const objectUserId = this.toObjectId(userId)

    const cart = await CartModel.findOne({ userId: objectUserId })
    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, 'Cart is empty')
    }

    const currency = cart.items[0]?.currency ?? 'COP'

    const created = await OrderModel.create({
      userId: objectUserId,
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
      status: 'pending',
    })

    cart.items.splice(0, cart.items.length)
    cart.subtotal = 0
    cart.total = 0
    await cart.save()

    return this.toOrderDetailResponse(created)
  }

  async listOrders(userId: string, rawQuery: unknown) {
    const objectUserId = this.toObjectId(userId)
    const parsed = listOrdersQuerySchema.safeParse(rawQuery)

    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query params for orders listing')
    }

    const { page, limit } = parsed.data

    const [orders, total] = await Promise.all([
      OrderModel.find({ userId: objectUserId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ userId: objectUserId }),
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
    status: 'pending' | 'canceled'
    currency: string
    subtotal: number
    total: number
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
