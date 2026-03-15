import { model, Schema, type InferSchemaType } from 'mongoose'

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    message: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

contactMessageSchema.index({ createdAt: -1 })

export type ContactMessageDocument = InferSchemaType<typeof contactMessageSchema>
export const ContactMessageModel = model<ContactMessageDocument>('ContactMessage', contactMessageSchema)
