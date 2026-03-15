import { Router } from 'express'
import { ProductController } from './controllers/product.controller'

const productController = new ProductController()

export const productsRouter = Router()

productsRouter.get('/products', productController.listProducts)
productsRouter.get('/products/featured', productController.getFeaturedProducts)
productsRouter.get('/products/related/:id', productController.getRelatedProducts)
productsRouter.get('/products/:id', productController.getProductById)
