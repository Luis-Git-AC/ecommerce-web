import { model, Schema, type InferSchemaType } from 'mongoose'

const productImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
    publicId: { type: String, required: false, trim: true },
  },
  { _id: false },
)

const productSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'COP', trim: true },
    category: { type: String, required: true, trim: true, index: true },
    careLevel: { type: String, required: true, trim: true, index: true },
    lightLevel: { type: String, required: true, trim: true, index: true },
    size: { type: String, required: true, trim: true, index: true },
    petFriendly: { type: Boolean, required: true, default: false, index: true },
    isFeatured: { type: Boolean, required: true, default: false, index: true },
    images: {
      type: [productImageSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: 'At least one image is required',
      },
    },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

productSchema.index({ category: 1, isFeatured: -1, createdAt: -1 })
productSchema.index({ price: 1, createdAt: -1 })

export type ProductDocument = InferSchemaType<typeof productSchema>
export const ProductModel = model<ProductDocument>('Product', productSchema)
