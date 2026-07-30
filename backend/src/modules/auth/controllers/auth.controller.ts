import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../../../common/errors/http-error.js'
import { AuthService } from '../services/auth.service.js'

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.register(req.body, {
        userAgent: req.headers['user-agent'],
      })
      res.status(201).json({ data })
    } catch (error) {
      next(error)
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.login(req.body, { userAgent: req.headers['user-agent'] })
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.refresh(req.body, {
        userAgent: req.headers['user-agent'],
      })
      res.status(200).json({ data })
    } catch (error) {
      next(error)
    }
  }

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId
      if (!userId) {
        throw new HttpError(401, 'Unauthorized')
      }

      res.status(200).json({ data: await this.authService.getProfile(userId) })
    } catch (error) {
      next(error)
    }
  }

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId
      if (!userId) {
        throw new HttpError(401, 'Unauthorized')
      }

      res.status(200).json({ data: await this.authService.logoutAll(userId) })
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
