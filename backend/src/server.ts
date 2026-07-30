import { app } from './app.js'
import { connectToDatabase, disconnectDatabase } from './config/db.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'

async function startServer() {
  await connectToDatabase()

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, apiPrefix: env.API_PREFIX, nodeEnv: env.NODE_ENV },
      'API listening',
    )
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
