import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error'
import { ProductService } from '../services/product.service'

export class ProductController {
  constructor(private readonly productService: ProductService = new ProductService()) {}

  private getIdParam(req: Request): string {
    const idParam = req.params.id
    const id = Array.isArray(idParam) ? idParam[0] : idParam

    if (!id) {
      throw new HttpError(400, 'Product id is required')
    }

    return id
  }

  listProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const paginatedProducts = await this.productService.listProducts(req.query)
      res.status(200).json(paginatedProducts)
    } catch (error) {
      next(error)
    }
  }

  getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productService.getProductById(this.getIdParam(req))
      res.status(200).json(product)
    } catch (error) {
      next(error)
    }
  }

  getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.getFeaturedProducts()
      res.status(200).json(products)
    } catch (error) {
      next(error)
    }
  }

  getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.productService.getRelatedProducts(this.getIdParam(req))
      res.status(200).json(products)
    } catch (error) {
      next(error)
    }
  }
}
