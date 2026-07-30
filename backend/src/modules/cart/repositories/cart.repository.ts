import { Types } from 'mongoose'
import { CartModel } from '../schemas/cart.schema'

export class CartRepository {
  async findByUser(userId: Types.ObjectId) {
    return CartModel.findOne({ userId })
  }

  async createEmpty(userId: Types.ObjectId) {
    return CartModel.create({
      userId,
      items: [],
      subtotal: 0,
      total: 0,
    })
  }

  async findOrCreate(userId: Types.ObjectId) {
    const existing = await this.findByUser(userId)
    return existing ?? (await this.createEmpty(userId))
  }
}
