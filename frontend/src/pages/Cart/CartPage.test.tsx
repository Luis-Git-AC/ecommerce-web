import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CartPage from './CartPage'

vi.mock('../../components/layout/Header', () => ({
  default: () => <div>Header</div>,
}))

vi.mock('../../components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    accessToken: null,
  }),
}))

vi.mock('../../store/CartContext', () => ({
  useCart: () => ({
    cart: null,
    loading: false,
    error: null,
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
  }),
}))

describe('CartPage', () => {
  it('muestra el guard de autenticacion cuando no hay sesion', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Tu carrito está protegido' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/account')
  })
})
