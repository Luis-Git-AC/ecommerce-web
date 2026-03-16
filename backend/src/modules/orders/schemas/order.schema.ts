import { model, Schema, type InferSchemaType, Types } from 'mongoose'

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  {
    _id: false,
  },
)

const orderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true, index: true, ref: 'User' },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'COP', trim: true },
    status: { type: String, required: true, enum: ['pending', 'canceled'], default: 'pending', index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

orderSchema.index({ userId: 1, createdAt: -1 })

export type OrderDocument = InferSchemaType<typeof orderSchema>
export const OrderModel = model<OrderDocument>('Order', orderSchema)
