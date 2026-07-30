import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProductCard from './ProductCard'
import { formatMoney } from '@/utils/format'

describe('ProductCard', () => {
  it('renderiza nombre, precio y enlace de detalle', () => {
    render(
      <MemoryRouter>
        <ProductCard
          id="p-demo"
          name="Planta Demo"
          price={25}
          currency="EUR"
          image={{ src: '/demo.jpg', jpg: '/demo.jpg' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Planta Demo' })).toBeInTheDocument()

    const expectedPrice = formatMoney(25, 'EUR').replace(/\s/g, ' ')
    expect(screen.getByText(expectedPrice)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Ver detalle' })
    expect(link).toHaveAttribute('href', '/product/p-demo')
  })
})
