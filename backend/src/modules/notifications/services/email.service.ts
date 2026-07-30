import { Resend } from 'resend'
import { env } from '../../../config/env.js'
import { logger } from '../../../config/logger.js'

type OrderItem = {
  name: string
  quantity: number
  unitPrice: number
  currency: string
  lineTotal: number
}

type ShippingAddress = {
  fullName: string
  line1: string
  line2?: string | null
  city: string
  postalCode: string
  province: string
  country: string
  phone: string
}

type OrderConfirmation = {
  to: string
  orderId: string
  total: number
  currency: string
  items: OrderItem[]
  shippingAddress?: ShippingAddress | null
}

const BRAND_GREEN = '#2e8b57'
const INK = '#1f2a22'

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(value)
  } catch {
    return `${value} ${currency || 'EUR'}`
  }
}

export class EmailService {
  private readonly client: Resend | null

  constructor() {
    this.client = env.EMAIL_ENABLED && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
  }

  async sendOrderConfirmation(order: OrderConfirmation) {
    const subject = `Confirmación de tu pedido ${order.orderId}`
    const html = this.renderOrderConfirmation(order)

    if (!this.client) {
      logger.info(
        { to: order.to, orderId: order.orderId, subject },
        'Email deshabilitado: confirmación de pedido registrada en log en lugar de enviarse',
      )
      return { delivered: false as const }
    }

    try {
      await this.client.emails.send({
        from: env.EMAIL_FROM ?? 'Ecommerce Web <onboarding@resend.dev>',
        to: order.to,
        subject,
        html,
      })

      logger.info({ to: order.to, orderId: order.orderId }, 'Order confirmation email sent')
      return { delivered: true as const }
    } catch (error) {
      logger.error(
        { orderId: order.orderId, error: error instanceof Error ? error.message : 'desconocido' },
        'Order confirmation email failed',
      )
      return { delivered: false as const }
    }
  }

  private renderOrderConfirmation(order: OrderConfirmation) {
    const rows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;">
            ${item.name}<br />
            <span style="color:#7b877f;font-size:13px;">
              ${item.quantity} × ${formatMoney(item.unitPrice, item.currency)}
            </span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #ece8e0;text-align:right;white-space:nowrap;">
            ${formatMoney(item.lineTotal, item.currency)}
          </td>
        </tr>`,
      )
      .join('')

    const address = order.shippingAddress
      ? `
        <h3 style="color:${INK};font-size:15px;margin:24px 0 8px;">Dirección de envío</h3>
        <p style="color:#4d6053;font-size:14px;line-height:1.6;margin:0;">
          ${order.shippingAddress.fullName}<br />
          ${order.shippingAddress.line1}${order.shippingAddress.line2 ? `<br />${order.shippingAddress.line2}` : ''}<br />
          ${order.shippingAddress.postalCode} ${order.shippingAddress.city} (${order.shippingAddress.province})<br />
          ${order.shippingAddress.country} · ${order.shippingAddress.phone}
        </p>`
      : ''

    return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:${INK};">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;font-size:20px;font-weight:700;color:${BRAND_GREEN};">
        🌿 Ecommerce Web
      </span>
    </div>
    <h1 style="font-size:22px;margin:0 0 8px;">¡Gracias por tu compra!</h1>
    <p style="color:#4d6053;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hemos confirmado tu pago. Tu pedido <strong>${order.orderId}</strong> ya está en preparación.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td style="padding:12px 0 0;font-weight:700;">Total</td>
          <td style="padding:12px 0 0;font-weight:700;text-align:right;color:${BRAND_GREEN};">
            ${formatMoney(order.total, order.currency)}
          </td>
        </tr>
      </tfoot>
    </table>
    ${address}
    <p style="color:#7b877f;font-size:12px;margin-top:32px;text-align:center;">
      Este es un correo automático de una tienda de demostración.
    </p>
  </div>`
  }
}
