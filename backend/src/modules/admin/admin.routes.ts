import { Router } from 'express'
import { requireAdmin, requireAuth } from '../../common/middlewares/auth.middleware'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { AdminController } from './controllers/admin.controller'

const adminController = new AdminController()

const adminReadRateLimit = createRateLimitMiddleware({
	keyPrefix: 'admin-read',
	windowMs: 15 * 60 * 1000,
	maxRequests: 120,
})

export const adminRouter = Router()

adminRouter.use('/admin', requireAuth, requireAdmin)
adminRouter.get('/admin/users', adminReadRateLimit, adminController.listUsers)
adminRouter.get('/admin/orders', adminReadRateLimit, adminController.listOrders)
