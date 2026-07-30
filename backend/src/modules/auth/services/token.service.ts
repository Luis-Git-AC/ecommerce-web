import { randomUUID } from 'node:crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { HttpError } from '../../../common/errors/http-error.js'
import { env } from '../../../config/env.js'
import type { UserRole } from '../schemas/user.schema.js'

type TokenType = 'access' | 'refresh'

type AuthTokenPayload = {
  sub: string
  type: TokenType
  role: UserRole
  tokenVersion: number
}

export type VerifiedToken = {
  userId: string
  role: UserRole
  tokenVersion: number
}

export class TokenService {
  private readonly accessSecret = env.JWT_ACCESS_SECRET
  private readonly refreshSecret = env.JWT_REFRESH_SECRET

  private readonly accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  private readonly refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']

  createAccessToken(userId: string, role: UserRole, tokenVersion: number) {
    return jwt.sign({ type: 'access', role, tokenVersion }, this.accessSecret, {
      subject: userId,
      expiresIn: this.accessExpiresIn,
    })
  }

  createRefreshToken(userId: string, role: UserRole, tokenVersion: number) {
    return jwt.sign({ type: 'refresh', role, tokenVersion }, this.refreshSecret, {
      subject: userId,
      expiresIn: this.refreshExpiresIn,
      jwtid: randomUUID(),
    })
  }

  verifyAccessToken(token: string) {
    return this.verifyToken(token, this.accessSecret, 'access')
  }

  verifyRefreshToken(token: string) {
    return this.verifyToken(token, this.refreshSecret, 'refresh')
  }

  getExpiryDate(token: string): Date {
    const decoded = jwt.decode(token)

    if (decoded && typeof decoded === 'object' && typeof decoded.exp === 'number') {
      return new Date(decoded.exp * 1000)
    }

    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }

  private verifyToken(token: string, secret: string, expectedType: TokenType): VerifiedToken {
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload & AuthTokenPayload
      if (payload.type !== expectedType || typeof payload.sub !== 'string') {
        throw new HttpError(401, 'Invalid token')
      }

      return {
        userId: payload.sub,
        role: payload.role === 'admin' ? 'admin' : 'user',
        tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
      }
    } catch {
      throw new HttpError(401, 'Invalid or expired token')
    }
  }
}
