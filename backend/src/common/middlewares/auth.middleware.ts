import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors/http-error'
import { TokenService } from '../../modules/auth/services/token.service'

const tokenService = new TokenService()

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
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
    req.auth = { userId: decoded.userId }
    next()
  } catch (error) {
    next(error)
  }
}
