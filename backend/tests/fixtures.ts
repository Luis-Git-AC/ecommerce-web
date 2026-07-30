/** Direccion de envio valida reutilizable por los tests de pedidos. */
export const validShippingAddress = {
  fullName: 'Lucia Fernandez',
  line1: 'Calle Mayor 12, 3B',
  city: 'Madrid',
  postalCode: '28013',
  province: 'Madrid',
  country: 'ES',
  phone: '+34 600 123 456',
}

export const createOrderBody = { shippingAddress: validShippingAddress }
