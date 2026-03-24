import { Router } from 'express'
import { createRateLimitMiddleware } from '../../common/middlewares/rate-limit.middleware'
import { ProductController } from './controllers/product.controller'

const productController = new ProductController()

const readProductsRateLimit = createRateLimitMiddleware({
	keyPrefix: 'products-read',
	windowMs: 15 * 60 * 1000,
	maxRequests: 300,
})

export const productsRouter = Router()

productsRouter.get('/products', readProductsRateLimit, productController.listProducts)
productsRouter.get('/products/featured', readProductsRateLimit, productController.getFeaturedProducts)
productsRouter.get('/products/related/:id', readProductsRateLimit, productController.getRelatedProducts)
productsRouter.get('/products/:id', readProductsRateLimit, productController.getProductById)
