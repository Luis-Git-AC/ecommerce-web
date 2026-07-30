import { describe, expect, it } from 'vitest'
import { emptyShippingAddress, validateShippingAddress } from './shipping'
import type { ShippingAddress } from '@/types/commerce'

const validAddress: ShippingAddress = {
  fullName: 'Lucía Fernández',
  line1: 'Calle Mayor 12, 3B',
  line2: '',
  city: 'Madrid',
  postalCode: '28013',
  province: 'Madrid',
  country: 'ES',
  phone: '+34 600 123 456',
}

describe('validateShippingAddress', () => {
  it('no devuelve errores para una dirección válida', () => {
    expect(validateShippingAddress(validAddress)).toEqual({})
  })

  it('exige un código postal de 5 dígitos', () => {
    const errors = validateShippingAddress({ ...validAddress, postalCode: '281' })
    expect(errors.postalCode).toBeDefined()
  })

  it('rechaza un teléfono no válido', () => {
    const errors = validateShippingAddress({ ...validAddress, phone: '123' })
    expect(errors.phone).toBeDefined()
  })

  it('acumula varios errores a la vez', () => {
    const errors = validateShippingAddress(emptyShippingAddress)
    expect(Object.keys(errors).length).toBeGreaterThan(3)
  })

  it('el estado vacío tiene España como país por defecto', () => {
    expect(emptyShippingAddress.country).toBe('ES')
  })
})
