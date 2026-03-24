import { Types } from 'mongoose'
import { HttpError } from '../../../common/errors/http-error'
import { OrderModel } from '../../orders/schemas/order.schema'
import { UserModel } from '../../auth/schemas/user.schema'
import { listAdminOrdersQuerySchema, listAdminUsersQuerySchema } from '../dto/admin.dto'

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export class AdminService {
  async listUsers(rawQuery: unknown) {
    const parsed = listAdminUsersQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query params for admin users listing')
    }

    const { page, limit, q } = parsed.data
    const query = q
      ? {
          $or: [
            { email: { $regex: escapeRegex(q), $options: 'i' } },
            { name: { $regex: escapeRegex(q), $options: 'i' } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select({ _id: 1, name: 1, email: 1, role: 1, createdAt: 1 })
        .lean(),
      UserModel.countDocuments(query),
    ])

    const userObjectIds = users.map((user) => user._id)
    const ordersByUser = userObjectIds.length
      ? await OrderModel.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { userId: { $in: userObjectIds } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
        ])
      : []

    const ordersCountMap = new Map(ordersByUser.map((item) => [String(item._id), item.count]))

    return {
      items: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'user',
        createdAt: user.createdAt,
        ordersCount: ordersCountMap.get(String(user._id)) ?? 0,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async listOrders(rawQuery: unknown) {
    const parsed = listAdminOrdersQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query params for admin orders listing')
    }

    const { page, limit, status, userId, q } = parsed.data
    const query: Record<string, unknown> = {}

    if (status) {
      query.status = status
    }

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new HttpError(400, 'Invalid user id')
      }

      query.userId = new Types.ObjectId(userId)
    }

    if (q) {
      const matchingUsers = await UserModel.find({
        $or: [
          { email: { $regex: escapeRegex(q), $options: 'i' } },
          { name: { $regex: escapeRegex(q), $options: 'i' } },
        ],
      })
        .select({ _id: 1 })
        .lean()

      const userIds = matchingUsers.map((user) => user._id)
      if (userIds.length === 0) {
        return {
          items: [],
          page,
          limit,
          total: 0,
          totalPages: 1,
        }
      }

      query.userId = { $in: userIds }
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email role')
        .lean(),
      OrderModel.countDocuments(query),
    ])

    return {
      items: orders.map((order) => {
        const user = order.userId as unknown as { _id: Types.ObjectId; name?: string; email?: string; role?: string }

        return {
          id: String(order._id),
          status: order.status,
          currency: order.currency,
          total: order.total,
          totalItems: order.items.reduce((acc, item) => acc + item.quantity, 0),
          createdAt: order.createdAt,
          user: {
            id: user ? String(user._id) : String(order.userId),
            name: user?.name ?? 'Usuario',
            email: user?.email ?? 'sin-email',
            role: user?.role === 'admin' ? 'admin' : 'user',
          },
        }
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }
}
