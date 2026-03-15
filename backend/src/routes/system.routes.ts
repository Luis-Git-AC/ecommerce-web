import { Router } from 'express'
import { isCloudinaryConfigured } from '../config/cloudinary'
import { isDatabaseReady } from '../config/db'

export const systemRouter = Router()

systemRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    storage: isCloudinaryConfigured ? 'cloudinary' : 'unconfigured',
  })
})

systemRouter.get('/ready', (_req, res) => {
  if (!isDatabaseReady()) {
    res.status(503).json({ status: 'degraded', database: 'disconnected' })
    return
  }

  res.status(200).json({ status: 'ready', database: 'connected' })
})
