import type { ShippingAddress } from '@/types/commerce'

export const emptyShippingAddress: ShippingAddress = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  province: '',
  country: 'ES',
  phone: '',
}

export type ShippingAddressErrors = Partial<Record<keyof ShippingAddress, string>>

export const validateShippingAddress = (address: ShippingAddress): ShippingAddressErrors => {
  const errors: ShippingAddressErrors = {}

  if (address.fullName.trim().length < 3) {
    errors.fullName = 'Indica el nombre completo del destinatario.'
  }

  if (address.line1.trim().length < 4) {
    errors.line1 = 'Indica la dirección (calle, número y piso).'
  }

  if (address.city.trim().length < 2) {
    errors.city = 'Indica la ciudad.'
  }

  if (!/^\d{5}$/.test(address.postalCode.trim())) {
    errors.postalCode = 'El código postal debe tener 5 dígitos.'
  }

  if (address.province.trim().length < 2) {
    errors.province = 'Indica la provincia.'
  }

  if (!/^[+]?[\d\s.-]{9,20}$/.test(address.phone.trim())) {
    errors.phone = 'Indica un teléfono de contacto válido.'
  }

  return errors
}
