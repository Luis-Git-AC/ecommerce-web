import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error.js'
import { logger } from '../../../config/logger.js'
import { ClubLeadModel } from '../../content/schemas/club-lead.schema.js'
import { ContactMessageModel } from '../../content/schemas/contact-message.schema.js'
import {
  ALLOWED_STATUS_TRANSITIONS,
  OrderModel,
  type OrderStatus,
} from '../../orders/schemas/order.schema.js'
import { ProductModel } from '../../products/schemas/product.schema.js'
import { UserModel } from '../../auth/schemas/user.schema.js'
import { listContentQuerySchema, updateOrderStatusSchema } from '../dto/admin-products.dto.js'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'pendiente de pago',
  paid: 'pagado',
  processing: 'en preparación',
  shipped: 'enviado',
  delivered: 'entregado',
  failed: 'fallido',
  canceled: 'cancelado',
}

export class AdminOperationsService {
  async updateOrderStatus(orderId: string, rawBody: unknown) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new HttpError(400, 'Identificador de pedido no válido')
    }

    const parsed = updateOrderStatusSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Estado de pedido no válido')
    }

    const order = await OrderModel.findById(orderId)
    if (!order) {
      throw new HttpError(404, 'Pedido no encontrado')
    }

    const current = order.status as OrderStatus
    const next = parsed.data.status

    if (current === next) {
      throw new HttpError(409, `El pedido ya está en estado "${STATUS_LABELS[next]}"`)
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[current]
    if (!allowed.includes(next)) {
      const opciones = allowed.length
        ? allowed.map((status) => STATUS_LABELS[status]).join(', ')
        : 'ninguno (es un estado final)'

      throw new HttpError(
        409,
        `No se puede pasar de "${STATUS_LABELS[current]}" a "${STATUS_LABELS[next]}". Transiciones válidas: ${opciones}.`,
      )
    }

    order.status = next
    await order.save()

    logger.info({ orderId, from: current, to: next }, 'Admin order status updated')

    return {
      id: String(order._id),
      status: order.status,
      previousStatus: current,
      allowedNextStatuses: ALLOWED_STATUS_TRANSITIONS[next],
    }
  }

  async listContactMessages(rawQuery: unknown) {
    const { page, limit } = this.parsePagination(rawQuery)

    const [items, total] = await Promise.all([
      ContactMessageModel.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessageModel.countDocuments({}),
    ])

    return {
      items: items.map((message) => ({
        id: String(message._id),
        name: message.name,
        email: message.email,
        message: message.message,
        createdAt: message.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async listClubLeads(rawQuery: unknown) {
    const { page, limit } = this.parsePagination(rawQuery)

    const [items, total] = await Promise.all([
      ClubLeadModel.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ClubLeadModel.countDocuments({}),
    ])

    return {
      items: items.map((lead) => ({
        id: String(lead._id),
        name: lead.name,
        email: lead.email,
        plan: lead.plan,
        createdAt: lead.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const paidStatuses: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered']

    const [revenueAgg, ordersByStatus, topProducts, newUsers, lowStock, totals] = await Promise.all(
      [
        OrderModel.aggregate<{ _id: null; total: number; count: number }>([
          { $match: { status: { $in: paidStatuses } } },
          { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
        ]),
        OrderModel.aggregate<{ _id: OrderStatus; count: number }>([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        OrderModel.aggregate<{ _id: string; name: string; units: number; revenue: number }>([
          { $match: { status: { $in: paidStatuses } } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.slug',
              name: { $first: '$items.name' },
              units: { $sum: '$items.quantity' },
              revenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { units: -1 } },
          { $limit: 5 },
        ]),
        UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        ProductModel.countDocuments({ isActive: true, stock: { $lte: 5 } }),
        Promise.all([
          ProductModel.countDocuments({ isActive: true }),
          UserModel.countDocuments({}),
          OrderModel.countDocuments({}),
        ]),
      ],
    )

    const [activeProducts, totalUsers, totalOrders] = totals

    return {
      revenue: {
        total: Math.round((revenueAgg[0]?.total ?? 0) * 100) / 100,
        paidOrders: revenueAgg[0]?.count ?? 0,
        currency: 'EUR',
      },
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map((entry) => [entry._id, entry.count]),
      ) as Partial<Record<OrderStatus, number>>,
      topProducts: topProducts.map((product) => ({
        slug: product._id,
        name: product.name,
        units: product.units,
        revenue: Math.round(product.revenue * 100) / 100,
      })),
      newUsersLast30Days: newUsers,
      lowStockProducts: lowStock,
      totals: { activeProducts, totalUsers, totalOrders },
    }
  }

  private parsePagination(rawQuery: unknown) {
    const parsed = listContentQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      throw new HttpError(400, 'Parámetros de paginación no válidos')
    }

    return parsed.data
  }
}
