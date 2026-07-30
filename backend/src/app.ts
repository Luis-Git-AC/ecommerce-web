// Triple-slash (not `import`) so the Rollup-based Vercel build doesn't try to bundle this type-only file at runtime.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/express.d.ts" />
import cors from 'cors'
import express from 'express'
import { pinoHttp } from 'pino-http'
import type { Request } from 'express'
import type { CorsOptions } from 'cors'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { connectToDatabase } from './config/db.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { cartRouter } from './modules/cart/cart.routes.js'
import { contentRouter } from './modules/content/content.routes.js'
import { ordersRouter } from './modules/orders/orders.routes.js'
import { paymentsRouter } from './modules/payments/payments.routes.js'
import { productsRouter } from './modules/products/products.routes.js'
import { docsRouter } from './docs/docs.routes.js'
import { systemRouter } from './routes/system.routes.js'

// helmet es un paquete dual CJS+ESM cuyo default export el type-checker de
// Vercel (Linux) resolvia como no invocable bajo node16/nodenext, aunque en
// local (Windows) y en runtime (verificado con curl real) resuelve bien.
// require() via createRequire evita la logica de interop ESM/CJS para el
// VALOR en runtime. El tipo fija `resolution-mode: 'require'` explicitamente
// (en vez de dejar que cada entorno infiera cual condicion de `exports` usar,
// que es justo lo que causaba la inconsistencia) para que coincida siempre
// con lo que require() resuelve de verdad.
const require = createRequire(import.meta.url)
const helmet: typeof import('helmet', { with: { 'resolution-mode': 'require' } }).default =
  require('helmet')

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
      const requestId =
        typeof incoming === 'string' && incoming.trim().length > 0 ? incoming.trim() : randomUUID()

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

app.use(env.API_PREFIX, docsRouter)

app.use(env.API_PREFIX, async (req, _res, next) => {
  if (req.path === '/health' || req.path === '/ready') {
    next()
    return
  }

  try {
    await connectToDatabase()
    next()
  } catch (error) {
    next(error)
  }
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

export default app
