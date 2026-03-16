import { model, Schema, type InferSchemaType, Types } from 'mongoose'

const cartItemSchema = new Schema(
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

const cartSchema = new Schema(
  {
    userId: { type: Types.ObjectId, required: true, unique: true, index: true, ref: 'User' },
    items: { type: [cartItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export type CartDocument = InferSchemaType<typeof cartSchema>
export const CartModel = model<CartDocument>('Cart', cartSchema)
