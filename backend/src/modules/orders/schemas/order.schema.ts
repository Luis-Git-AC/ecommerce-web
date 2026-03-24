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
    currency: { type: String, required: true, default: 'EUR', trim: true },
    status: { type: String, required: true, enum: ['pending', 'paid', 'failed', 'canceled'], default: 'pending', index: true },
    paymentIntentId: { type: String, required: false, trim: true },
    paymentLastError: { type: String, required: false, trim: true },
    paidAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ userId: 1, status: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true })

export type OrderDocument = InferSchemaType<typeof orderSchema>
export const OrderModel = model<OrderDocument>('Order', orderSchema)
