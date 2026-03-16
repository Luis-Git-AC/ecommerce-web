import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { AuthController } from './controllers/auth.controller'

const authController = new AuthController()

const createAuthRateLimit = (keyPrefix: string) =>
  createRateLimitMiddleware({
    keyPrefix,
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
  })

export const authRouter = Router()

authRouter.post('/auth/register', createAuthRateLimit('auth-register'), authController.register)
authRouter.post('/auth/login', createAuthRateLimit('auth-login'), authController.login)
authRouter.post('/auth/refresh', createAuthRateLimit('auth-refresh'), authController.refresh)
authRouter.post('/auth/logout', createAuthRateLimit('auth-logout'), authController.logout)
