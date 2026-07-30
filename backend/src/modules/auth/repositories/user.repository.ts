import { Types } from 'mongoose'
import { UserModel } from '../schemas/user.schema'

export class UserRepository {
  async findByEmail(email: string) {
    return UserModel.findOne({ email })
  }

  async existsByEmail(email: string) {
    const found = await UserModel.findOne({ email }).select({ _id: 1 }).lean()
    return Boolean(found)
  }

  async findById(userId: string | Types.ObjectId) {
    return UserModel.findById(userId)
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    return UserModel.create(data)
  }
}
