import { model, Schema, type InferSchemaType } from 'mongoose'

export const USER_ROLES = ['user', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const MAX_ACTIVE_SESSIONS = 5

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, required: false, trim: true, maxlength: 300 },
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    role: { type: String, required: true, enum: USER_ROLES, default: 'user', index: true },
    passwordHash: { type: String, required: true },

    tokenVersion: { type: Number, required: true, default: 0 },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

userSchema.index({ createdAt: -1 })
userSchema.index({ 'refreshTokens.tokenHash': 1 })

export type UserDocument = InferSchemaType<typeof userSchema>
export const UserModel = model<UserDocument>('User', userSchema)
