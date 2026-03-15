import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { ContentController } from './controllers/content.controller'

const contentController = new ContentController()

const createWriteRateLimit = (keyPrefix: string) =>
  createRateLimitMiddleware({
    keyPrefix,
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  })

export const contentRouter = Router()

contentRouter.get('/blog', contentController.listBlog)
contentRouter.get('/blog/:slug', contentController.getBlogBySlug)

contentRouter.post('/contact/messages', createWriteRateLimit('contact-messages'), contentController.createContactMessage)
contentRouter.post('/newsletter/subscribe', createWriteRateLimit('newsletter-subscribe'), contentController.subscribeNewsletter)
contentRouter.post('/club/leads', createWriteRateLimit('club-leads'), contentController.createClubLead)
