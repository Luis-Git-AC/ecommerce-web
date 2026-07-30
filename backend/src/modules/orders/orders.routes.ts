import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware.js'
import { requireAuth } from '../../common/middlewares/auth.middleware.js'
import { OrderController } from './controllers/order.controller.js'

const orderController = new OrderController()

export const ordersRouter = Router()

const createOrderRateLimit = createRateLimitMiddleware({
  keyPrefix: 'orders-create',
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
})

ordersRouter.use('/orders', requireAuth)

ordersRouter.post('/orders', createOrderRateLimit, orderController.createOrder)
ordersRouter.get('/orders', orderController.listOrders)
ordersRouter.get('/orders/:id', orderController.getOrderById)
