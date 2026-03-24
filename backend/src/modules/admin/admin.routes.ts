import { Router } from 'express'
import { requireAdmin, requireAuth } from '../../common/middlewares/auth.middleware'
import { AdminController } from './controllers/admin.controller'

const adminController = new AdminController()

export const adminRouter = Router()

adminRouter.use('/admin', requireAuth, requireAdmin)
adminRouter.get('/admin/users', adminController.listUsers)
adminRouter.get('/admin/orders', adminController.listOrders)
