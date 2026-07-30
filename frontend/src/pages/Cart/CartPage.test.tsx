import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CartPage from './CartPage'

vi.mock('@/components/layout/Header', () => ({
  default: () => <div>Header</div>,
}))

vi.mock('@/components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('@/store/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    accessToken: 'token-demo',
  }),
}))

vi.mock('@/store/CartContext', () => ({
  useCart: () => ({
    cart: {
      id: 'cart-1',
      userId: 'user-1',
      items: [
        {
          productId: 'p-1',
          slug: 'monstera',
          name: 'Monstera Deliciosa',
          image: '/monstera.jpg',
          quantity: 2,
          unitPrice: 30,
          currency: 'EUR',
          lineTotal: 60,
        },
      ],
      subtotal: 60,
      total: 60,
      totalItems: 2,
    },
    loading: false,
    error: null,
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
  }),
}))

describe('CartPage', () => {
  it('muestra los productos del carrito con su total', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument()
  })
})
