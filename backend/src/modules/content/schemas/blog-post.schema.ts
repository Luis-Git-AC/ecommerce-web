import { model, Schema, type InferSchemaType } from 'mongoose'

const blogPostSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    publishedAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

blogPostSchema.index({ publishedAt: -1 })
blogPostSchema.index({ category: 1, publishedAt: -1 })

export type BlogPostDocument = InferSchemaType<typeof blogPostSchema>
export const BlogPostModel = model<BlogPostDocument>('BlogPost', blogPostSchema)
