import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error'
import { AdminOperationsService } from '../services/admin-operations.service'
import { AdminProductService } from '../services/admin-product.service'

export class AdminWriteController {
  constructor(
    private readonly productService: AdminProductService = new AdminProductService(),
    private readonly operationsService: AdminOperationsService = new AdminOperationsService(),
  ) {}

  private getParam(req: Request, key: string) {
    const raw = req.params[key]
    const value = Array.isArray(raw) ? raw[0] : raw

    if (!value) {
      throw new HttpError(400, `Falta el parámetro "${key}"`)
    }

    return value
  }

  listProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ data: await this.productService.listProducts(req.query) })
    } catch (error) {
      next(error)
    }
  }

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json({ data: await this.productService.createProduct(req.body) })
    } catch (error) {
      next(error)
    }
  }

  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.productService.updateProduct(this.getParam(req, 'id'), req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  deactivateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.productService.deactivateProduct(this.getParam(req, 'id'))
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.productService.uploadImage(this.getParam(req, 'id'), req.file)
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.productService.deleteImage(
        this.getParam(req, 'id'),
        decodeURIComponent(this.getParam(req, 'publicId')),
      )
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.operationsService.updateOrderStatus(
        this.getParam(req, 'id'),
        req.body,
      )
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  listContactMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ data: await this.operationsService.listContactMessages(req.query) })
    } catch (error) {
      next(error)
    }
  }

  listClubLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ data: await this.operationsService.listClubLeads(req.query) })
    } catch (error) {
      next(error)
    }
  }

  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ data: await this.operationsService.getStats() })
    } catch (error) {
      next(error)
    }
  }
}
