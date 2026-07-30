import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware.js'
import { requireAuth } from '../../common/middlewares/auth.middleware.js'
import { AuthController } from './controllers/auth.controller.js'

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
authRouter.get('/auth/me', requireAuth, authController.me)
authRouter.post('/auth/logout-all', requireAuth, authController.logoutAll)
