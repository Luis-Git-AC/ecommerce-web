import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { requireAuth } from '../../common/middlewares/auth.middleware'
import { CartController } from './controllers/cart.controller'

const cartController = new CartController()

export const cartRouter = Router()

const cartWriteRateLimit = createRateLimitMiddleware({
	keyPrefix: 'cart-write',
	windowMs: 15 * 60 * 1000,
	maxRequests: 80,
})

cartRouter.use(requireAuth)

cartRouter.get('/cart', cartController.getCart)
cartRouter.post('/cart/items', cartWriteRateLimit, cartController.addItem)
cartRouter.patch('/cart/items/:productId', cartWriteRateLimit, cartController.updateItem)
cartRouter.delete('/cart/items/:productId', cartWriteRateLimit, cartController.removeItem)
cartRouter.delete('/cart/clear', cartWriteRateLimit, cartController.clear)
