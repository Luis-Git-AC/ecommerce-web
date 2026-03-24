import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error'
import { PaymentService } from '../services/payment.service'

export class PaymentController {
  constructor(private readonly paymentService: PaymentService = new PaymentService()) {}

  private getAuthUserId(req: Request) {
    const userId = req.auth?.userId
    if (!userId) {
      throw new HttpError(401, 'Unauthorized')
    }

    return userId
  }

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.paymentService.createPaymentIntent(this.getAuthUserId(req), req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signatureHeader = req.headers['stripe-signature']
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader

      if (!signature) {
        throw new HttpError(400, 'Missing Stripe signature')
      }

      if (!req.rawBody) {
        throw new HttpError(400, 'Raw request body is required')
      }

      const data = await this.paymentService.handleWebhook(req.rawBody, signature)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}
