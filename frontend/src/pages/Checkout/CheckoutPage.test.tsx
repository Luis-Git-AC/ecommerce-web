import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CheckoutPage from './CheckoutPage'
import { paymentsRepository, type PaymentIntentSession } from '../../services/payments.repository'
import type { OrderDetail } from '@/types/commerce'

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
  intent: {
    orderId: 'order-123',
    status: 'pending',
    currency: 'EUR',
    total: 10,
    paymentIntentId: 'pi_demo',
    clientSecret: 'pi_demo_secret',
  } satisfies PaymentIntentSession,
}))

vi.mock('../../config/env', () => ({
  appEnv: {
    mode: 'test',
    apiBaseUrl: 'http://localhost:4000/api',
    stripePublishableKey: 'pk_test_dummy_never_used',
    siteUrl: 'http://localhost:5173',
    ogImageUrl: '',
  },
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => null,
  useElements: () => null,
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
    createIntent: vi.fn().mockResolvedValue(mocks.intent),
  },
}))

describe('CheckoutPage', () => {
  afterEach(() => {
    vi.mocked(paymentsRepository.createIntent).mockResolvedValue(mocks.intent)
  })

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

  it('mantiene visible el resumen del pedido si falla la preparacion del pago', async () => {
    vi.mocked(paymentsRepository.createIntent).mockRejectedValue(
      new Error('Stripe is not configured'),
    )

    render(
      <MemoryRouter initialEntries={['/checkout/order-123']}>
        <Routes>
          <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // El pedido ya se habia cargado, asi que el fallo solo degrada el panel de
    // pago: el usuario tiene que poder seguir viendo su pedido.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Resumen del pedido' })).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'No pudimos iniciar el pago' }),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Stripe is not configured')).toBeInTheDocument()
  })
})
