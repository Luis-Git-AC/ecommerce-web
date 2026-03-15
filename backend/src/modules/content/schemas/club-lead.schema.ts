import { model, Schema, type InferSchemaType } from 'mongoose'

const clubLeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    plan: { type: String, required: true, enum: ['basic', 'medio', 'premium'] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

clubLeadSchema.index({ createdAt: -1 })

export type ClubLeadDocument = InferSchemaType<typeof clubLeadSchema>
export const ClubLeadModel = model<ClubLeadDocument>('ClubLead', clubLeadSchema)
