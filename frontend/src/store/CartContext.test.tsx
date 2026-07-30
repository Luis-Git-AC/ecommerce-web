import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider, useCart } from './CartContext'
import type { Cart } from '@/types/commerce'

const authState = vi.hoisted(() => ({ accessToken: 'token-demo' as string | null }))

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ accessToken: authState.accessToken }),
}))

const cartRepo = vi.hoisted(() => ({
  getCart: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('@/services/cart.repository', () => ({
  cartRepository: cartRepo,
}))

const makeCart = (overrides: Partial<Cart> = {}): Cart => ({
  id: 'cart-1',
  userId: 'user-1',
  items: [
    {
      productId: 'p-1',
      slug: 'monstera',
      name: 'Monstera',
      image: '/m.jpg',
      quantity: 2,
      unitPrice: 30,
      currency: 'EUR',
      lineTotal: 60,
    },
  ],
  subtotal: 60,
  total: 60,
  totalItems: 2,
  ...overrides,
})

function Probe() {
  const { cart, totalItems, addToCart } = useCart()
  return (
    <div>
      <p data-testid="total-items">{totalItems}</p>
      <p data-testid="cart-name">{cart?.items[0]?.name ?? 'sin carrito'}</p>
      <button type="button" onClick={() => void addToCart('p-2', 1)}>
        Añadir
      </button>
    </div>
  )
}

const renderCart = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Probe />
      </CartProvider>
    </QueryClientProvider>,
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.accessToken = 'token-demo'
    cartRepo.getCart.mockResolvedValue(makeCart())
  })

  it('carga el carrito del usuario autenticado', async () => {
    renderCart()

    await waitFor(() => {
      expect(screen.getByTestId('cart-name')).toHaveTextContent('Monstera')
    })
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
  })

  it('no pide el carrito sin sesión', async () => {
    authState.accessToken = null
    renderCart()

    await waitFor(() => {
      expect(screen.getByTestId('cart-name')).toHaveTextContent('sin carrito')
    })
    expect(cartRepo.getCart).not.toHaveBeenCalled()
  })

  it('añade un producto a través de la mutación', async () => {
    const user = userEvent.setup()
    cartRepo.addItem.mockResolvedValue(makeCart({ totalItems: 3 }))
    renderCart()

    await waitFor(() => expect(screen.getByTestId('cart-name')).toHaveTextContent('Monstera'))

    await user.click(screen.getByRole('button', { name: 'Añadir' }))

    await waitFor(() => {
      expect(cartRepo.addItem).toHaveBeenCalledWith('token-demo', {
        productId: 'p-2',
        quantity: 1,
      })
    })
  })
})
