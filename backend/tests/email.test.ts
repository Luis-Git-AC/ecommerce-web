import { describe, expect, it } from 'vitest'
import { EmailService } from '../src/modules/notifications/services/email.service.js'

describe('EmailService', () => {
  it('no envía y registra en log cuando el email está deshabilitado', async () => {
    // En el entorno de test EMAIL_ENABLED no es "true": el servicio degrada.
    const service = new EmailService()

    const result = await service.sendOrderConfirmation({
      to: 'cliente@example.com',
      orderId: 'order-123',
      total: 45,
      currency: 'EUR',
      items: [{ name: 'Monstera', quantity: 1, unitPrice: 45, currency: 'EUR', lineTotal: 45 }],
      shippingAddress: {
        fullName: 'Lucia Fernandez',
        line1: 'Calle Mayor 12',
        city: 'Madrid',
        postalCode: '28013',
        province: 'Madrid',
        country: 'ES',
        phone: '+34 600 123 456',
      },
    })

    // La propiedad clave: nunca lanza y no bloquea el flujo de pago.
    expect(result.delivered).toBe(false)
  })

  it('genera un HTML con los datos del pedido', async () => {
    const service = new EmailService()
    // @ts-expect-error acceso al método privado solo para el test
    const html = service.renderOrderConfirmation({
      to: 'x@example.com',
      orderId: 'order-777',
      total: 60,
      currency: 'EUR',
      items: [{ name: 'Pothos', quantity: 2, unitPrice: 30, currency: 'EUR', lineTotal: 60 }],
      shippingAddress: null,
    })

    expect(html).toContain('order-777')
    expect(html).toContain('Pothos')
    expect(html).toContain('¡Gracias por tu compra!')
  })

  it('no revienta el flujo de pago aunque el envío falle', async () => {
    const service = new EmailService()

    // Inyecta un cliente que siempre falla en el campo privado.
    Object.defineProperty(service, 'client', {
      value: { emails: { send: () => Promise.reject(new Error('Resend caído')) } },
      configurable: true,
    })

    const result = await service.sendOrderConfirmation({
      to: 'x@example.com',
      orderId: 'order-1',
      total: 10,
      currency: 'EUR',
      items: [],
    })

    // El error se captura dentro del servicio: nunca se propaga al webhook.
    expect(result.delivered).toBe(false)
  })
})
