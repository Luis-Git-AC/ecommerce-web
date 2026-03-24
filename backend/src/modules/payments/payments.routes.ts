import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { requireAuth } from '../../common/middlewares/auth.middleware'
import { PaymentController } from './controllers/payment.controller'

const paymentController = new PaymentController()

export const paymentsRouter = Router()

const createIntentRateLimit = createRateLimitMiddleware({
  keyPrefix: 'payments-intents-create',
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
})

paymentsRouter.post('/payments/webhook', paymentController.handleWebhook)
paymentsRouter.post('/payments/intents', requireAuth, createIntentRateLimit, paymentController.createPaymentIntent)
