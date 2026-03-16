import jwt, { type SignOptions } from 'jsonwebtoken'
import { HttpError } from '../../../common/errors/http-error'
import { env } from '../../../config/env'

type TokenType = 'access' | 'refresh'

type AuthTokenPayload = {
  sub: string
  type: TokenType
}

export class TokenService {
  private readonly accessSecret = env.JWT_ACCESS_SECRET
  private readonly refreshSecret = env.JWT_REFRESH_SECRET

  private readonly accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  private readonly refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']

  createAccessToken(userId: string) {
    return jwt.sign({ type: 'access' }, this.accessSecret, {
      subject: userId,
      expiresIn: this.accessExpiresIn,
    })
  }

  createRefreshToken(userId: string) {
    return jwt.sign({ type: 'refresh' }, this.refreshSecret, {
      subject: userId,
      expiresIn: this.refreshExpiresIn,
    })
  }

  verifyAccessToken(token: string) {
    return this.verifyToken(token, this.accessSecret, 'access')
  }

  verifyRefreshToken(token: string) {
    return this.verifyToken(token, this.refreshSecret, 'refresh')
  }

  private verifyToken(token: string, secret: string, expectedType: TokenType) {
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload & AuthTokenPayload
      if (payload.type !== expectedType || typeof payload.sub !== 'string') {
        throw new HttpError(401, 'Invalid token')
      }

      return {
        userId: payload.sub,
      }
    } catch {
      throw new HttpError(401, 'Invalid or expired token')
    }
  }
}
