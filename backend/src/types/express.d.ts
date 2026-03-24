import 'express-serve-static-core'
import type { UserRole } from '../modules/auth/schemas/user.schema'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string
      role: UserRole
    }
    rawBody?: Buffer
  }
}

export {}
