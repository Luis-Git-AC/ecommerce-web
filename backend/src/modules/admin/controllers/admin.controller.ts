import type { NextFunction, Request, Response } from 'express'
import { AdminService } from '../services/admin.service'

export class AdminController {
  constructor(private readonly adminService: AdminService = new AdminService()) {}

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.adminService.listUsers(req.query)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.adminService.listOrders(req.query)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}
