import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error'
import { OrderService } from '../services/order.service'

export class OrderController {
  constructor(private readonly orderService: OrderService = new OrderService()) {}

  private getAuthUserId(req: Request) {
    const userId = req.auth?.userId
    if (!userId) {
      throw new HttpError(401, 'Unauthorized')
    }

    return userId
  }

  private getOrderIdParam(req: Request) {
    const orderIdParam = req.params.id
    const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam

    if (!orderId) {
      throw new HttpError(400, 'Order id is required')
    }

    return orderId
  }

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.orderService.createOrder(this.getAuthUserId(req))
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.orderService.listOrders(this.getAuthUserId(req), req.query)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.orderService.getOrderById(this.getAuthUserId(req), this.getOrderIdParam(req))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}
