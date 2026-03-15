import { HttpError } from '../../../common/errors/http-error'
import {
  blogListQuerySchema,
  createClubLeadSchema,
  createContactMessageSchema,
  subscribeNewsletterSchema,
  type BlogListQuery,
} from '../dto/content.dto'
import { BlogPostModel } from '../schemas/blog-post.schema'
import { ClubLeadModel } from '../schemas/club-lead.schema'
import { ContactMessageModel } from '../schemas/contact-message.schema'
import { NewsletterSubscriberModel } from '../schemas/newsletter-subscriber.schema'

export class ContentService {
  async listBlog(rawQuery: unknown) {
    const parsed = blogListQuerySchema.safeParse(rawQuery)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid query params for blog listing')
    }

    const query = this.toBlogListQuery(parsed.data)
    const dbQuery = query.category ? { category: query.category } : {}

    const [items, total] = await Promise.all([
      BlogPostModel.find(dbQuery)
        .sort({ publishedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      BlogPostModel.countDocuments(dbQuery),
    ])

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    }
  }

  async getBlogBySlug(slug: string) {
    const normalizedSlug = slug.trim()
    if (!normalizedSlug) {
      throw new HttpError(400, 'Blog slug is required')
    }

    const post = await BlogPostModel.findOne({ slug: normalizedSlug }).lean()
    if (!post) {
      throw new HttpError(404, 'Blog post not found')
    }

    return post
  }

  async createContactMessage(rawBody: unknown) {
    const parsed = createContactMessageSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for contact message')
    }

    const created = await ContactMessageModel.create({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    })

    return {
      id: String(created._id),
      createdAt: created.createdAt,
    }
  }

  async subscribeNewsletter(rawBody: unknown) {
    const parsed = subscribeNewsletterSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for newsletter subscription')
    }

    const email = parsed.data.email.toLowerCase()

    const result = await NewsletterSubscriberModel.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          status: 'active',
          subscribedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean()

    return {
      id: String(result?._id),
      email,
      status: result?.status ?? 'active',
    }
  }

  async createClubLead(rawBody: unknown) {
    const parsed = createClubLeadSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for club lead')
    }

    const created = await ClubLeadModel.create({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    })

    return {
      id: String(created._id),
      createdAt: created.createdAt,
    }
  }

  private toBlogListQuery(query: BlogListQuery) {
    return {
      page: query.page,
      limit: query.limit,
      category: query.category,
    }
  }
}
