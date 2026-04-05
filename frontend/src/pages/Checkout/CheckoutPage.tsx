import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { appEnv } from '../../config/env'
import { ApiClientError } from '../../services/api.client'
import { ordersRepository } from '../../services/orders.repository'
import { paymentsRepository } from '../../services/payments.repository'
import { useAuth } from '../../store/AuthContext'
import { useCart } from '../../store/CartContext'
import type { OrderDetail } from '../../types/commerce'
import styles from './CheckoutPage.module.css'

const stripePublishableKey = appEnv.stripePublishableKey
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} EUR`
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getCheckoutReturnUrl = (orderId: string) => {
  const url = new URL(window.location.origin)
  url.pathname = `/checkout/${orderId}`
  url.search = ''
  url.hash = ''
  return url.toString()
}

function CheckoutForm({
  order,
  onPaid,
}: {
  order: OrderDetail
  onPaid: () => Promise<void>
}) {
  const stripe = useStripe()
  const elements = useElements()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: getCheckoutReturnUrl(order.id),
        },
        redirect: 'if_required',
      })

      if (result.error) {
        setError(result.error.message ?? 'No pudimos confirmar el pago.')
        return
      }

      if (result.paymentIntent?.status === 'succeeded') {
        setSuccess('Pago confirmado correctamente.')
        await onPaid()
        return
      }

      setSuccess('Estamos procesando tu pago.')
    } catch {
      setError('No pudimos confirmar el pago. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className={styles.panel}>
      <h2>Pagar pedido</h2>
      <p className="muted">Total a pagar: {formatMoney(order.total, order.currency)}</p>
      <form onSubmit={handleSubmit} className={styles.paymentForm}>
        <PaymentElement />
        <button type="submit" className={`btn ${styles.payButton}`} disabled={submitting || !stripe || !elements}>
          {submitting ? 'Procesando pago...' : 'Pagar ahora'}
        </button>
      </form>
      {success ? (
        <p className="state-box state-success" role="status" aria-live="polite">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="state-box state-error" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </article>
  )
}

export default function CheckoutPage() {
  const { orderId } = useParams()
  const { isAuthenticated, accessToken } = useAuth()
  const { refreshCart, clearCartOptimistic } = useCart()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const elementsOptions = useMemo(() => ({ clientSecret: clientSecret ?? '' }), [clientSecret])

  const loadCheckoutData = useCallback(async () => {
    if (!isAuthenticated || !accessToken || !orderId) {
      setOrder(null)
      setClientSecret(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const orderData = await ordersRepository.getById(accessToken, orderId)
      setOrder(orderData)

      if (orderData.status === 'paid') {
        setClientSecret(null)
        clearCartOptimistic()
        await refreshCart()
        return
      }

      const intentData = await paymentsRepository.createIntent(accessToken, {
        orderId,
      })

      setClientSecret(intentData.clientSecret)
    } catch (incomingError) {
      if (incomingError instanceof ApiClientError) {
        if (incomingError.message.toLowerCase().includes('already paid')) {
          try {
            const refreshedOrder = await ordersRepository.getById(accessToken, orderId)
            setOrder(refreshedOrder)
            setClientSecret(null)
            setError(null)
            clearCartOptimistic()
            await refreshCart()
            return
          } catch {
            // no-op, keep fallback error below
          }
        }

        setError(incomingError.message)
      } else if (incomingError instanceof Error) {
        setError(incomingError.message)
      } else {
        setError('No pudimos preparar tu pago.')
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken, clearCartOptimistic, isAuthenticated, orderId, refreshCart])

  const reconcileAfterPayment = async () => {
    if (!isAuthenticated || !accessToken || !orderId) {
      return
    }

    setLoading(true)
    setError(null)

    const maxAttempts = 3
    const delayMs = 1200

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const latestOrder = await ordersRepository.getById(accessToken, orderId)
        setOrder(latestOrder)

        if (latestOrder.status === 'paid') {
          setClientSecret(null)
          clearCartOptimistic()
          await refreshCart()
          setLoading(false)
          return
        }

        if (latestOrder.status === 'failed' || latestOrder.status === 'canceled') {
          setClientSecret(null)
          setLoading(false)
          return
        }
      } catch (incomingError) {
        if (incomingError instanceof ApiClientError) {
          setError(incomingError.message)
        } else if (incomingError instanceof Error) {
          setError(incomingError.message)
        } else {
          setError('No pudimos confirmar el estado del pedido.')
        }

        setLoading(false)
        return
      }

      if (attempt < maxAttempts) {
        await wait(delayMs)
      }
    }

    await loadCheckoutData()
    setLoading(false)
  }

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !orderId) {
      setOrder(null)
      setClientSecret(null)
      return
    }

    const run = async () => {
      await loadCheckoutData()
    }

    void run()
  }, [accessToken, isAuthenticated, loadCheckoutData, orderId])

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.checkout}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Pago</p>
          <h1>Checkout seguro</h1>
          <p className="muted">Confirma tu compra con tarjeta en modo de prueba.</p>
        </section>

        {!isAuthenticated ? (
          <section className={`container ${styles.panel} ${styles.statePanel}`}>
            <h2>Necesitas iniciar sesión</h2>
            <p className="muted">Debes autenticarte para pagar este pedido.</p>
            <Link to="/account" className="btn">
              Ir a cuenta
            </Link>
          </section>
        ) : loading ? (
          <section className={`container ${styles.panel} ${styles.statePanel}`} role="status" aria-live="polite">
            <h2>Preparando pago...</h2>
          </section>
        ) : error ? (
          <section className={`container ${styles.panel} ${styles.statePanel}`}>
            <p className="state-box state-error" role="alert" aria-live="assertive">
              {error}
            </p>
            <Link to="/cart" className="btn btn-outline">
              Volver al carrito
            </Link>
          </section>
        ) : !order ? (
          <section className={`container ${styles.panel} ${styles.statePanel}`}>
            <h2>Pedido no encontrado</h2>
            <Link to="/account" className="btn btn-outline">
              Ver mi cuenta
            </Link>
          </section>
        ) : (
          <section className={`container ${styles.content}`}>
            <article className={styles.panel}>
              <h2>Resumen del pedido</h2>
              <p>
                <strong>Pedido:</strong> {order.id}
              </p>
              <p>
                <strong>Estado:</strong> {order.status}
              </p>
              <p>
                <strong>Total:</strong> {formatMoney(order.total, order.currency)}
              </p>
              <Link to="/account" className="btn btn-outline">
                Ver pedidos
              </Link>
            </article>

            {order.status === 'paid' ? (
              <article className={styles.panel}>
                <h2>Pago completado</h2>
                <p className="muted">Este pedido ya está pagado.</p>
                <Link to={`/account/orders/${order.id}`} className="btn">
                  Ver detalle del pedido
                </Link>
              </article>
            ) : !stripePromise ? (
              <article className={styles.panel}>
                <h2>Stripe no configurado</h2>
                <p className="muted">Falta la clave publicable de Stripe en el frontend.</p>
              </article>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <CheckoutForm
                  order={order}
                  onPaid={async () => {
                    await reconcileAfterPayment()
                  }}
                />
              </Elements>
            ) : (
              <article className={styles.panel}>
                <h2>No pudimos iniciar el pago</h2>
                <p className="muted">Intenta recargar esta pantalla.</p>
              </article>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
