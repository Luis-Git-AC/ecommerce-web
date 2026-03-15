import { model, Schema, type InferSchemaType } from 'mongoose'

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    status: { type: String, required: true, default: 'active' },
    subscribedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export type NewsletterSubscriberDocument = InferSchemaType<typeof newsletterSubscriberSchema>
export const NewsletterSubscriberModel = model<NewsletterSubscriberDocument>('NewsletterSubscriber', newsletterSubscriberSchema)
