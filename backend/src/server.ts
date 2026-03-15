import { app } from './app'
import { connectToDatabase, disconnectDatabase } from './config/db'
import { env } from './config/env'
import { logger } from './config/logger'

async function startServer() {
  await connectToDatabase()

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}${env.API_PREFIX}`)
  })

  const shutdown = async () => {
    logger.info('Shutting down server')
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

startServer().catch((error) => {
  logger.error(error)
  process.exit(1)
})
