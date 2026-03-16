import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error'
import { CartService } from '../services/cart.service'

export class CartController {
  constructor(private readonly cartService: CartService = new CartService()) {}

  private getAuthUserId(req: Request) {
    const userId = req.auth?.userId
    if (!userId) {
      throw new HttpError(401, 'Unauthorized')
    }

    return userId
  }

  private getProductIdParam(req: Request) {
    const productIdParam = req.params.productId
    const productId = Array.isArray(productIdParam) ? productIdParam[0] : productIdParam

    if (!productId) {
      throw new HttpError(400, 'Product id is required')
    }

    return productId
  }

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.cartService.getCart(this.getAuthUserId(req))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.cartService.addItem(this.getAuthUserId(req), req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.cartService.updateItem(this.getAuthUserId(req), this.getProductIdParam(req), req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.cartService.removeItem(this.getAuthUserId(req), this.getProductIdParam(req))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  clear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.cartService.clear(this.getAuthUserId(req))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}
