import { apiRequest } from './api.client'
import type { AuthSession } from '../types/commerce'

type AuthPayload = {
  email: string
  password: string
}

type RegisterPayload = AuthPayload & {
  name: string
}

type WrappedResponse<T> = {
  data: T
}

const SESSION_STORAGE_KEY = 'ecommerce.session'

export const sessionStorage = {
  load(): AuthSession | null {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.id) {
        return null
      }

      return parsed
    } catch {
      return null
    }
  },
  save(session: AuthSession) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  },
  clear() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  },
}

export const authRepository = {
  async register(payload: RegisterPayload) {
    const response = await apiRequest<WrappedResponse<AuthSession>>('/auth/register', {
      method: 'POST',
      body: payload,
    })

    return response.data
  },

  async login(payload: AuthPayload) {
    const response = await apiRequest<WrappedResponse<AuthSession>>('/auth/login', {
      method: 'POST',
      body: payload,
    })

    return response.data
  },

  async refresh(refreshToken: string) {
    const response = await apiRequest<WrappedResponse<Pick<AuthSession, 'accessToken' | 'refreshToken'>>>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })

    return response.data
  },

  async logout(refreshToken: string) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    })
  },
}
