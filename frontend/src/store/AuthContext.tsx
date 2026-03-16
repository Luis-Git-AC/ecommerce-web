/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useEffect } from 'react'
import { ApiClientError } from '../services/api.client'
import { authRepository, sessionStorage } from '../services/auth.repository'
import type { AuthSession } from '../types/commerce'

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = LoginPayload & {
  name: string
}

type AuthContextValue = {
  session: AuthSession | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const REFRESH_LEEWAY_MS = 60_000

const getTokenExpiryMs = (token: string) => {
  const parts = token.split('.')
  const payload = parts[1]

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = window.atob(normalized)
    const data = JSON.parse(decoded) as { exp?: unknown }

    if (typeof data.exp !== 'number') {
      return null
    }

    return data.exp * 1000
  } catch {
    return null
  }
}

const toClientError = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return 'Usuario o contraseña incorrectos.'
    }

    if (error.status === 0) {
      return 'No pudimos conectarnos en este momento. Intenta de nuevo.'
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'No pudimos completar la operación. Intenta de nuevo.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => sessionStorage.load())

  const storeSession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession)
    sessionStorage.save(nextSession)
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
    sessionStorage.clear()
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const data = await authRepository.login(payload)
      storeSession(data)
    } catch (error) {
      throw new Error(toClientError(error))
    }
  }, [storeSession])

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const data = await authRepository.register(payload)
      storeSession(data)
    } catch (error) {
      throw new Error(toClientError(error))
    }
  }, [storeSession])

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken

    if (!refreshToken) {
      clearSession()
      return
    }

    try {
      await authRepository.logout(refreshToken)
    } catch {
      // Logout local siempre para no bloquear salida por error de red.
    } finally {
      clearSession()
    }
  }, [clearSession, session?.refreshToken])

  useEffect(() => {
    if (!session?.accessToken || !session.refreshToken) {
      return
    }

    let timeoutId: number | null = null
    let canceled = false

    const scheduleRefresh = async () => {
      const expiryMs = getTokenExpiryMs(session.accessToken)

      if (!expiryMs) {
        return
      }

      const delay = Math.max(0, expiryMs - Date.now() - REFRESH_LEEWAY_MS)

      timeoutId = window.setTimeout(async () => {
        try {
          const tokens = await authRepository.refresh(session.refreshToken)
          if (canceled) {
            return
          }

          const nextSession: AuthSession = {
            user: session.user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }

          storeSession(nextSession)
        } catch {
          if (!canceled) {
            clearSession()
          }
        }
      }, delay)
    }

    void scheduleRefresh()

    return () => {
      canceled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [clearSession, session, storeSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      register,
      logout,
    }),
    [login, logout, register, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
