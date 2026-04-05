import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import type { Request } from 'express'
import type { CorsOptions } from 'cors'
import { randomUUID } from 'node:crypto'
import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler, notFoundHandler } from './middlewares/error-handler'
import { authRouter } from './modules/auth/auth.routes'
import { adminRouter } from './modules/admin/admin.routes'
import { cartRouter } from './modules/cart/cart.routes'
import { contentRouter } from './modules/content/content.routes'
import { ordersRouter } from './modules/orders/orders.routes'
import { paymentsRouter } from './modules/payments/payments.routes'
import { productsRouter } from './modules/products/products.routes'
import { systemRouter } from './routes/system.routes'

export const app = express()

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const allowAllOrigins = env.CORS_ORIGIN === '*'
const allowedOriginsSet = new Set(corsOrigins)

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (allowAllOrigins || !origin || allowedOriginsSet.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('CORS origin not allowed'))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  optionsSuccessStatus: 204,
  maxAge: 60 * 60 * 24,
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      const request = req as Request

      if (request.originalUrl.startsWith(`${env.API_PREFIX}/payments/webhook`)) {
        request.rawBody = Buffer.from(buf)
      }
    },
  }),
)
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id']
      const requestId = typeof incoming === 'string' && incoming.trim().length > 0
        ? incoming.trim()
        : randomUUID()

      res.setHeader('x-request-id', requestId)
      return requestId
    },
    customProps: (req) => ({
      requestId: (req as { id?: string }).id,
    }),
  }),
)

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend is running' })
})

app.use(env.API_PREFIX, systemRouter)
app.use(env.API_PREFIX, productsRouter)
app.use(env.API_PREFIX, contentRouter)
app.use(env.API_PREFIX, authRouter)
app.use(env.API_PREFIX, adminRouter)
app.use(env.API_PREFIX, cartRouter)
app.use(env.API_PREFIX, ordersRouter)
app.use(env.API_PREFIX, paymentsRouter)

app.use(notFoundHandler)
app.use(errorHandler)
