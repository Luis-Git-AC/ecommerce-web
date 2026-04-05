import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CheckoutPage from './CheckoutPage'
import type { OrderDetail } from '../../types/commerce'

const mocks = vi.hoisted(() => ({
  orderDetail: {
    id: 'order-123',
    userId: 'user-1',
    status: 'pending',
    currency: 'EUR',
    subtotal: 10,
    total: 10,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies OrderDetail,
}))

vi.mock('../../components/layout/Header', () => ({
  default: () => <div>Header</div>,
}))

vi.mock('../../components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    accessToken: 'token-demo',
  }),
}))

vi.mock('../../store/CartContext', () => ({
  useCart: () => ({
    refreshCart: vi.fn().mockResolvedValue(undefined),
    clearCartOptimistic: vi.fn(),
  }),
}))

vi.mock('../../services/orders.repository', () => ({
  ordersRepository: {
    getById: vi.fn().mockResolvedValue(mocks.orderDetail),
  },
}))

vi.mock('../../services/payments.repository', () => ({
  paymentsRepository: {
    createIntent: vi.fn().mockResolvedValue({
      orderId: 'order-123',
      status: 'pending',
      currency: 'EUR',
      total: 10,
      paymentIntentId: 'pi_demo',
      clientSecret: 'pi_demo_secret',
    }),
  },
}))

describe('CheckoutPage', () => {
  it('renderiza el resumen del pedido y el formulario de pago para una orden pendiente', async () => {
    render(
      <MemoryRouter initialEntries={['/checkout/order-123']}>
        <Routes>
          <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Resumen del pedido' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Pagar pedido' })).toBeInTheDocument()
    })
  })
})