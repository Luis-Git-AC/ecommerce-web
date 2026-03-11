import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProductCard from './ProductCard'

describe('ProductCard', () => {
  it('renderiza nombre, precio y enlace de detalle', () => {
    render(
      <MemoryRouter>
        <ProductCard
          id="p-demo"
          name="Planta Demo"
          price="$25"
          image={{ src: '/demo.jpg', jpg: '/demo.jpg' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Planta Demo' })).toBeInTheDocument()
    expect(screen.getByText('$25')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Ver detalle' })
    expect(link).toHaveAttribute('href', '/product/p-demo')
  })
})
