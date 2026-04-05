import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AccountPage from './AccountPage'

vi.mock('../../components/layout/Header', () => ({
  default: () => <div>Header</div>,
}))

vi.mock('../../components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    session: null,
    accessToken: null,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('AccountPage', () => {
  it('renderiza los formularios de login y registro cuando no hay sesion', () => {
    render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrarme' })).toBeInTheDocument()
  })
})
