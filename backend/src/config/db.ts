import mongoose from 'mongoose'
import { env } from './env'
import { logger } from './logger'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const isDatabaseReady = () => mongoose.connection.readyState === 1

export async function connectToDatabase() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in backend/.env')
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 5000,
      })

      logger.info('MongoDB connected')
      return
    } catch (error) {
      lastError = error
      logger.warn(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`)

      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * attempt)
      }
    }
  }

  throw lastError
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected')
  }
}
