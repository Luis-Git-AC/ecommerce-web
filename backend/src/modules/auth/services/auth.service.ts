import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { HttpError } from '../../../common/errors/http-error'
import { loginSchema, refreshSessionSchema, registerSchema } from '../dto/auth.dto'
import { UserModel } from '../schemas/user.schema'
import { TokenService } from './token.service'

const SALT_ROUNDS = 12

type AuthResponse = {
  user: {
    id: string
    name: string
    email: string
  }
  accessToken: string
  refreshToken: string
}

export class AuthService {
  constructor(private readonly tokenService: TokenService = new TokenService()) {}

  async register(rawBody: unknown): Promise<AuthResponse> {
    const parsed = registerSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for register')
    }

    const email = parsed.data.email.toLowerCase()
    const existing = await UserModel.findOne({ email }).select({ _id: 1 }).lean()
    if (existing) {
      throw new HttpError(409, 'Email is already in use')
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS)

    const created = await UserModel.create({
      name: parsed.data.name,
      email,
      passwordHash,
    })

    const tokens = this.issueTokens(String(created._id))
    created.refreshTokenHash = this.hashToken(tokens.refreshToken)
    await created.save()

    return {
      user: {
        id: String(created._id),
        name: created.name,
        email: created.email,
      },
      ...tokens,
    }
  }

  async login(rawBody: unknown): Promise<AuthResponse> {
    const parsed = loginSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for login')
    }

    const email = parsed.data.email.toLowerCase()
    const user = await UserModel.findOne({ email })
    if (!user) {
      throw new HttpError(401, 'Invalid credentials')
    }

    const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid credentials')
    }

    const tokens = this.issueTokens(String(user._id))
    user.refreshTokenHash = this.hashToken(tokens.refreshToken)
    await user.save()

    return {
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
      ...tokens,
    }
  }

  async refresh(rawBody: unknown) {
    const parsed = refreshSessionSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for refresh')
    }

    const decoded = this.tokenService.verifyRefreshToken(parsed.data.refreshToken)
    const user = await UserModel.findById(decoded.userId)
    if (!user || !user.refreshTokenHash) {
      throw new HttpError(401, 'Session not found')
    }

    const incomingHash = this.hashToken(parsed.data.refreshToken)
    if (incomingHash !== user.refreshTokenHash) {
      throw new HttpError(401, 'Session not found')
    }

    const tokens = this.issueTokens(String(user._id))
    user.refreshTokenHash = this.hashToken(tokens.refreshToken)
    await user.save()

    return tokens
  }

  async logout(rawBody: unknown) {
    const parsed = refreshSessionSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for logout')
    }

    try {
      const decoded = this.tokenService.verifyRefreshToken(parsed.data.refreshToken)
      const user = await UserModel.findById(decoded.userId)

      if (user) {
        const incomingHash = this.hashToken(parsed.data.refreshToken)
        if (incomingHash === user.refreshTokenHash) {
          user.refreshTokenHash = undefined
          await user.save()
        }
      }
    } catch {
      // Mantiene logout idempotente para evitar filtrar informacion de sesion.
    }

    return { success: true }
  }

  private issueTokens(userId: string) {
    const accessToken = this.tokenService.createAccessToken(userId)
    const refreshToken = this.tokenService.createRefreshToken(userId)

    return { accessToken, refreshToken }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}
