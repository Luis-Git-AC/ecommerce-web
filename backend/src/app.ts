import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler, notFoundHandler } from './middlewares/error-handler'
import { authRouter } from './modules/auth/auth.routes'
import { cartRouter } from './modules/cart/cart.routes'
import { contentRouter } from './modules/content/content.routes'
import { ordersRouter } from './modules/orders/orders.routes'
import { productsRouter } from './modules/products/products.routes'
import { systemRouter } from './routes/system.routes'

export const app = express()

const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const corsOptions = env.CORS_ORIGIN === '*' ? undefined : { origin: corsOrigins }

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(pinoHttp({ logger }))

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend is running' })
})

app.use(env.API_PREFIX, systemRouter)
app.use(env.API_PREFIX, productsRouter)
app.use(env.API_PREFIX, contentRouter)
app.use(env.API_PREFIX, authRouter)
app.use(env.API_PREFIX, cartRouter)
app.use(env.API_PREFIX, ordersRouter)

app.use(notFoundHandler)
app.use(errorHandler)
