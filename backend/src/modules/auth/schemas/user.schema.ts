import { model, Schema, type InferSchemaType } from 'mongoose'

export const USER_ROLES = ['user', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    role: { type: String, required: true, enum: USER_ROLES, default: 'user', index: true },
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
