import { model, Schema, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

userSchema.index({ createdAt: -1 })

export type UserDocument = InferSchemaType<typeof userSchema>
export const UserModel = model<UserDocument>('User', userSchema)
