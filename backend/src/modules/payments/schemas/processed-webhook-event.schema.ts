import { model, Schema, type InferSchemaType } from 'mongoose'

const processedWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    processedAt: { type: Date, required: true, default: Date.now },
  },
  {
    versionKey: false,
  },
)

processedWebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

export type ProcessedWebhookEventDocument = InferSchemaType<typeof processedWebhookEventSchema>
export const ProcessedWebhookEventModel = model<ProcessedWebhookEventDocument>(
  'ProcessedWebhookEvent',
  processedWebhookEventSchema,
)
