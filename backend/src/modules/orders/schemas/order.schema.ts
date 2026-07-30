import { model, Schema, type InferSchemaType, Types } from 'mongoose'

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'failed',
  'canceled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'failed', 'canceled'],
  paid: ['processing', 'canceled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  failed: [],
  canceled: [],
}

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

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, required: false, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'ES' },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true, index: true, ref: 'User' },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'EUR', trim: true },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
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
