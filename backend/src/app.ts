import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler, notFoundHandler } from './middlewares/error-handler'
import { contentRouter } from './modules/content/content.routes'
import { productsRouter } from './modules/products/products.routes'
import { systemRouter } from './routes/system.routes'

export const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(pinoHttp({ logger }))

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Backend is running' })
})

app.use(env.API_PREFIX, systemRouter)
app.use(env.API_PREFIX, productsRouter)
app.use(env.API_PREFIX, contentRouter)

app.use(notFoundHandler)
app.use(errorHandler)
