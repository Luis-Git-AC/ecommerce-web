import type { NextFunction, Request, Response } from 'express'
import { AuthService } from '../services/auth.service'

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.register(req.body)
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.login(req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.refresh(req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.logout(req.body)
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }
}
