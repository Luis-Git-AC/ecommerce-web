import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors/http-error'
import { TokenService } from '../../modules/auth/services/token.service'
import { UserModel } from '../../modules/auth/schemas/user.schema'

const tokenService = new TokenService()

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing bearer token')
    }

    const token = header.slice('Bearer '.length).trim()
    if (!token) {
      throw new HttpError(401, 'Missing bearer token')
    }

    const decoded = tokenService.verifyAccessToken(token)

    const user = await UserModel.findById(decoded.userId)
      .select({ tokenVersion: 1, role: 1 })
      .lean()

    if (!user) {
      throw new HttpError(401, 'Invalid or expired token')
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new HttpError(401, 'La sesión ha caducado. Inicia sesión de nuevo.')
    }

    req.auth = { userId: decoded.userId, role: user.role === 'admin' ? 'admin' : 'user' }
    next()
  } catch (error) {
    next(error)
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const role = req.auth?.role
    if (role !== 'admin') {
      throw new HttpError(403, 'Admin access required')
    }

    next()
  } catch (error) {
    next(error)
  }
}
