import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

const authState = vi.hoisted(() => ({
  current: {
    isAuthenticated: false,
    session: null as { user: { role: 'user' | 'admin' } } | null,
  },
}))

vi.mock('@/store/AuthContext', () => ({
  useAuth: () => authState.current,
}))

vi.mock('@/components/layout/Header', () => ({ default: () => <div>Header</div> }))
vi.mock('@/components/layout/Footer', () => ({ default: () => <div>Footer</div> }))

function LocationProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ''
  return (
    <div>
      <p>Pantalla de cuenta</p>
      <p data-testid="from">{from}</p>
    </div>
  )
}

const renderAt = (path: string, element: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account" element={<LocationProbe />} />
        <Route path="/cart" element={element} />
        <Route path="/admin" element={element} />
      </Routes>
    </MemoryRouter>,
  )

describe('ProtectedRoute', () => {
  it('redirige a /account cuando no hay sesion y conserva el destino', () => {
    authState.current = { isAuthenticated: false, session: null }

    renderAt(
      '/cart',
      <ProtectedRoute>
        <p>Contenido privado</p>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Pantalla de cuenta')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
    expect(screen.getByTestId('from')).toHaveTextContent('/cart')
  })

  it('renderiza el contenido cuando hay sesion', () => {
    authState.current = { isAuthenticated: true, session: { user: { role: 'user' } } }

    renderAt(
      '/cart',
      <ProtectedRoute>
        <p>Contenido privado</p>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('redirige a /account cuando no hay sesion', () => {
    authState.current = { isAuthenticated: false, session: null }

    renderAt(
      '/admin',
      <AdminRoute>
        <p>Panel admin</p>
      </AdminRoute>,
    )

    expect(screen.getByText('Pantalla de cuenta')).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })

  it('avisa de acceso restringido si la sesion no es de admin', () => {
    authState.current = { isAuthenticated: true, session: { user: { role: 'user' } } }

    renderAt(
      '/admin',
      <AdminRoute>
        <p>Panel admin</p>
      </AdminRoute>,
    )

    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })

  it('renderiza el panel para un admin', () => {
    authState.current = { isAuthenticated: true, session: { user: { role: 'admin' } } }

    renderAt(
      '/admin',
      <AdminRoute>
        <p>Panel admin</p>
      </AdminRoute>,
    )

    expect(screen.getByText('Panel admin')).toBeInTheDocument()
  })
})
