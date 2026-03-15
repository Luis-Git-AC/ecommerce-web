import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'
import { logger } from './logger'

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
} else {
  logger.warn('Cloudinary is not configured. Set CLOUDINARY_* variables in backend/.env')
}

export { cloudinary }
