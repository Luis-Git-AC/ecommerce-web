import { Types, type QueryFilter } from 'mongoose'
import { OrderModel } from '../schemas/order.schema.js'

import type { OrderDocument, OrderStatus } from '../schemas/order.schema.js'

type ListOrdersOptions = {
  userId: Types.ObjectId
  page: number
  limit: number
  includePending: boolean
}

export class OrderRepository {
  async findPaginatedByUser(options: ListOrdersOptions) {
    const { userId, page, limit, includePending } = options
    const query: QueryFilter<OrderDocument> = includePending
      ? { userId }
      : { userId, status: { $ne: 'pending' } }

    const [items, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ])

    return { items, total }
  }

  async findByIdForUser(orderId: Types.ObjectId, userId: Types.ObjectId) {
    return OrderModel.findOne({ _id: orderId, userId }).lean()
  }

  async findLatestByStatus(userId: Types.ObjectId, status: OrderStatus) {
    return OrderModel.findOne({ userId, status }).sort({ createdAt: -1 })
  }

  async create(data: Record<string, unknown>) {
    return OrderModel.create(data)
  }
}
