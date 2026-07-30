import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { logger } from '../../../config/logger'
import { CartRepository } from '../../cart/repositories/cart.repository'
import { ProductModel } from '../../products/schemas/product.schema'
import { createOrderSchema, listOrdersQuerySchema } from '../dto/orders.dto'
import { OrderRepository } from '../repositories/order.repository'
import type { OrderStatus } from '../schemas/order.schema'

type RevalidatedOrderLines = {
  items: Array<{
    productId: Types.ObjectId
    slug: string
    name: string
    image: string
    quantity: number
    unitPrice: number
    currency: string
    lineTotal: number
  }>
  subtotal: number
  total: number
  currency: string
}

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository = new OrderRepository(),
    private readonly cartRepository: CartRepository = new CartRepository(),
  ) {}

  async createOrder(userId: string, rawBody: unknown) {
    const objectUserId = this.toObjectId(userId)

    const parsedBody = createOrderSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      const detalle = parsedBody.error.issues.map((issue) => issue.message).join('; ')
      logger.warn({ userId, detalle }, 'Order create failed: invalid shipping address')
      throw new HttpError(400, `Direccion de envio no valida: ${detalle}`)
    }

    const shippingAddress = parsedBody.data.shippingAddress

    const cart = await this.cartRepository.findByUser(objectUserId)
    if (!cart || cart.items.length === 0) {
      logger.warn({ userId }, 'Order create failed: cart is empty')
      throw new HttpError(400, 'Cart is empty')
    }

    const revalidated = await this.revalidateCartLines(userId, cart.items)
    const currency = revalidated.currency
    const orderPayload = {
      shippingAddress,
      items: revalidated.items,
      subtotal: revalidated.subtotal,
      total: revalidated.total,
      currency,
      status: 'pending' as const,
      paymentIntentId: undefined,
      paymentLastError: undefined,
      paidAt: undefined,
    }

    const existingPending = await this.orderRepository.findLatestByStatus(objectUserId, 'pending')

    if (existingPending) {
      existingPending.set({
        shippingAddress: orderPayload.shippingAddress,
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

    const created = await this.orderRepository.create({
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
    const { items: orders, total } = await this.orderRepository.findPaginatedByUser({
      userId: objectUserId,
      page,
      limit,
      includePending,
    })

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

    const order = await this.orderRepository.findByIdForUser(
      new Types.ObjectId(orderId),
      objectUserId,
    )

    if (!order) {
      throw new HttpError(404, 'Order not found')
    }

    return this.toOrderDetailResponse(order)
  }

  private async revalidateCartLines(
    userId: string,
    cartItems: Array<{
      productId: Types.ObjectId
      quantity: number
      unitPrice: number
    }>,
  ): Promise<RevalidatedOrderLines> {
    const productIds = cartItems.map((item) => item.productId)
    const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).lean()
    const productsById = new Map(products.map((product) => [String(product._id), product]))

    const missing = cartItems.filter((item) => !productsById.has(String(item.productId)))
    if (missing.length > 0) {
      logger.warn(
        {
          userId,
          missingProductIds: missing.map((item) => String(item.productId)),
        },
        'Order create failed: cart contains products no longer available',
      )

      throw new HttpError(
        409,
        'Algunos productos de tu carrito ya no están disponibles. Revísalo antes de continuar.',
      )
    }

    const outOfStock = cartItems.filter((item) => {
      const product = productsById.get(String(item.productId))
      return product ? item.quantity > product.stock : false
    })

    if (outOfStock.length > 0) {
      const detalle = outOfStock
        .map((item) => {
          const product = productsById.get(String(item.productId))!
          return `${product.name} (quedan ${product.stock})`
        })
        .join(', ')

      logger.warn(
        {
          userId,
          outOfStock: outOfStock.map((item) => String(item.productId)),
        },
        'Order create failed: insufficient stock',
      )

      throw new HttpError(409, `No hay stock suficiente para: ${detalle}.`)
    }

    let subtotal = 0
    const items = cartItems.map((item) => {
      const product = productsById.get(String(item.productId))!

      if (product.price !== item.unitPrice) {
        logger.warn(
          {
            userId,
            productId: String(product._id),
            cartUnitPrice: item.unitPrice,
            catalogUnitPrice: product.price,
          },
          'Order line reprice: cart price differs from catalog price',
        )
      }

      const lineTotal = this.toMoney(product.price * item.quantity)
      subtotal += lineTotal

      return {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url ?? '',
        quantity: item.quantity,
        unitPrice: product.price,
        currency: product.currency,
        lineTotal,
      }
    })

    const normalizedSubtotal = this.toMoney(subtotal)

    return {
      items,
      subtotal: normalizedSubtotal,
      total: normalizedSubtotal,
      currency: items[0]?.currency ?? 'EUR',
    }
  }

  private toMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100
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
    status: OrderStatus
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
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName,
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2 ?? undefined,
            city: order.shippingAddress.city,
            postalCode: order.shippingAddress.postalCode,
            province: order.shippingAddress.province,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone,
          }
        : undefined,
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
