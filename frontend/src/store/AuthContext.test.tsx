import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

const authRepo = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

const sessionStore = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('@/services/auth.repository', () => ({
  authRepository: authRepo,
  sessionStorage: sessionStore,
}))

const buildSession = () => ({
  user: { id: 'u1', name: 'Ana', email: 'ana@example.com', role: 'user' as const },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
})

function Probe() {
  const { isAuthenticated, session, login } = useAuth()
  return (
    <div>
      <p data-testid="auth">{isAuthenticated ? 'sí' : 'no'}</p>
      <p data-testid="name">{session?.user.name ?? '—'}</p>
      <button
        type="button"
        onClick={() => {
          login({ email: 'ana@example.com', password: 'Password123!' }).catch(() => {})
        }}
      >
        Entrar
      </button>
    </div>
  )
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStore.load.mockReturnValue(null)
    authRepo.me.mockResolvedValue({ activeSessions: 1 })
  })

  it('arranca sin sesión cuando el almacenamiento está vacío', () => {
    renderAuth()
    expect(screen.getByTestId('auth')).toHaveTextContent('no')
  })

  it('restaura la sesión guardada', () => {
    sessionStore.load.mockReturnValue(buildSession())
    renderAuth()
    expect(screen.getByTestId('auth')).toHaveTextContent('sí')
    expect(screen.getByTestId('name')).toHaveTextContent('Ana')
  })

  it('inicia sesión y persiste la sesión', async () => {
    const user = userEvent.setup()
    authRepo.login.mockResolvedValue(buildSession())
    renderAuth()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('sí')
    })
    expect(sessionStore.save).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'access-token' }),
    )
  })

  it('propaga un mensaje claro si el login falla', async () => {
    const user = userEvent.setup()
    authRepo.login.mockRejectedValue(new Error('Usuario o contraseña incorrectos.'))
    renderAuth()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(authRepo.login).toHaveBeenCalled()
    })
    expect(screen.getByTestId('auth')).toHaveTextContent('no')
  })
})
