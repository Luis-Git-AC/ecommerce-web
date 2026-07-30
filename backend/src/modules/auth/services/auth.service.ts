import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { HttpError } from '../../../common/errors/http-error.js'
import { logger } from '../../../config/logger.js'
import { loginSchema, refreshSessionSchema, registerSchema } from '../dto/auth.dto.js'
import { UserRepository } from '../repositories/user.repository.js'
import { MAX_ACTIVE_SESSIONS, type UserRole } from '../schemas/user.schema.js'
import { TokenService } from './token.service.js'

// Ver comentario en app.ts sobre require() + resolution-mode explicito. A
// diferencia de helmet, el build CJS de bcryptjs (`export = bcrypt`, sin
// `default`) no expone `.default`: require() devuelve el namespace con
// `.hash`/`.compare` directamente en la raiz (verificado en runtime), asi que
// el tipo va sin `.default` para que coincida con el valor real.
const require = createRequire(import.meta.url)
const bcrypt: typeof import('bcryptjs', { with: { 'resolution-mode': 'require' } }) =
  require('bcryptjs')
const SALT_ROUNDS = 12

type AuthResponse = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  accessToken: string
  refreshToken: string
}

type SessionContext = {
  userAgent?: string
}

export class AuthService {
  constructor(
    private readonly tokenService: TokenService = new TokenService(),
    private readonly userRepository: UserRepository = new UserRepository(),
  ) {}

  async register(rawBody: unknown, context: SessionContext = {}): Promise<AuthResponse> {
    const parsed = registerSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for register')
    }

    const email = parsed.data.email.toLowerCase()
    const existing = await this.userRepository.existsByEmail(email)
    if (existing) {
      logger.warn({ email }, 'Auth register conflict: email already in use')
      throw new HttpError(409, 'Email is already in use')
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS)

    const created = await this.userRepository.create({
      name: parsed.data.name,
      email,
      passwordHash,
    })

    const role = created.role === 'admin' ? 'admin' : 'user'
    const tokens = this.issueTokens(String(created._id), role, created.tokenVersion)
    this.pushSession(created, tokens.refreshToken, context)
    await created.save()

    logger.info(
      { userId: String(created._id), email: created.email, role },
      'Auth register success',
    )

    return {
      user: { id: String(created._id), name: created.name, email: created.email, role },
      ...tokens,
    }
  }

  async login(rawBody: unknown, context: SessionContext = {}): Promise<AuthResponse> {
    const parsed = loginSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for login')
    }

    const email = parsed.data.email.toLowerCase()
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      logger.warn({ email }, 'Auth login failed: user not found')
      throw new HttpError(401, 'Invalid credentials')
    }

    const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!isValidPassword) {
      logger.warn({ email, userId: String(user._id) }, 'Auth login failed: invalid password')
      throw new HttpError(401, 'Invalid credentials')
    }

    const role = user.role === 'admin' ? 'admin' : 'user'
    const tokens = this.issueTokens(String(user._id), role, user.tokenVersion)
    this.pushSession(user, tokens.refreshToken, context)
    await user.save()

    logger.info(
      { userId: String(user._id), email: user.email, role, sessions: user.refreshTokens.length },
      'Auth login success',
    )

    return {
      user: { id: String(user._id), name: user.name, email: user.email, role },
      ...tokens,
    }
  }

  async refresh(rawBody: unknown, context: SessionContext = {}) {
    const parsed = refreshSessionSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for refresh')
    }

    const decoded = this.tokenService.verifyRefreshToken(parsed.data.refreshToken)
    const user = await this.userRepository.findById(decoded.userId)
    if (!user) {
      logger.warn({ userId: decoded.userId }, 'Auth refresh failed: user not found')
      throw new HttpError(401, 'Session not found')
    }

    const incomingHash = this.hashToken(parsed.data.refreshToken)
    const sessionIndex = user.refreshTokens.findIndex(
      (session) => session.tokenHash === incomingHash,
    )

    if (sessionIndex < 0) {
      user.tokenVersion += 1
      user.refreshTokens.splice(0, user.refreshTokens.length)
      await user.save()

      logger.warn(
        { userId: String(user._id), tokenVersion: user.tokenVersion },
        'Auth refresh token reuse detected: all sessions revoked',
      )

      throw new HttpError(401, 'Session not found')
    }

    const role = user.role === 'admin' ? 'admin' : 'user'
    const tokens = this.issueTokens(String(user._id), role, user.tokenVersion)

    user.refreshTokens.splice(sessionIndex, 1)
    this.pushSession(user, tokens.refreshToken, context)
    await user.save()

    logger.info({ userId: String(user._id), role }, 'Auth refresh success')

    return tokens
  }

  async logout(rawBody: unknown) {
    const parsed = refreshSessionSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid payload for logout')
    }

    try {
      const decoded = this.tokenService.verifyRefreshToken(parsed.data.refreshToken)
      const user = await this.userRepository.findById(decoded.userId)

      if (user) {
        const incomingHash = this.hashToken(parsed.data.refreshToken)
        const index = user.refreshTokens.findIndex((session) => session.tokenHash === incomingHash)

        if (index >= 0) {
          user.refreshTokens.splice(index, 1)
          await user.save()
          logger.info({ userId: String(user._id) }, 'Auth logout success')
        }
      }
    } catch {
      logger.debug('Auth logout ignored invalid session token')
    }

    return { success: true }
  }

  async logoutAll(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new HttpError(401, 'Unauthorized')
    }

    user.tokenVersion += 1
    user.refreshTokens.splice(0, user.refreshTokens.length)
    await user.save()

    logger.info({ userId, tokenVersion: user.tokenVersion }, 'Auth logout-all success')
    return { success: true }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new HttpError(401, 'Unauthorized')
    }

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
      createdAt: user.createdAt,
      activeSessions: user.refreshTokens.length,
    }
  }

  private issueTokens(userId: string, role: UserRole, tokenVersion: number) {
    return {
      accessToken: this.tokenService.createAccessToken(userId, role, tokenVersion),
      refreshToken: this.tokenService.createRefreshToken(userId, role, tokenVersion),
    }
  }

  private pushSession(
    user: {
      refreshTokens: Array<{
        tokenHash: string
        createdAt: Date
        expiresAt: Date
        userAgent?: string | null
      }>
    },
    refreshToken: string,
    context: SessionContext,
  ) {
    user.refreshTokens.push({
      tokenHash: this.hashToken(refreshToken),
      createdAt: new Date(),
      expiresAt: this.tokenService.getExpiryDate(refreshToken),
      userAgent: context.userAgent?.slice(0, 300),
    })

    const now = Date.now()
    const trimmed = user.refreshTokens
      .filter((session) => session.expiresAt.getTime() > now)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-MAX_ACTIVE_SESSIONS)

    user.refreshTokens.splice(0, user.refreshTokens.length, ...trimmed)
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}
