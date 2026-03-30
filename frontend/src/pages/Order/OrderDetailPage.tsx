import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { ApiClientError } from '../../services/api.client'
import { ordersRepository } from '../../services/orders.repository'
import { useAuth } from '../../store/AuthContext'
import type { OrderDetail } from '../../types/commerce'
import styles from './OrderDetailPage.module.css'

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

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { isAuthenticated, accessToken } = useAuth()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !id) {
      setOrder(null)
      return
    }

    let canceled = false

    const loadOrder = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await ordersRepository.getById(accessToken, id)
        if (!canceled) {
          setOrder(data)
        }
      } catch (incomingError) {
        if (canceled) {
          return
        }

        if (incomingError instanceof ApiClientError) {
          setError(incomingError.message)
        } else if (incomingError instanceof Error) {
          setError(incomingError.message)
        } else {
          setError('No pudimos cargar el pedido.')
        }
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      canceled = true
    }
  }, [accessToken, id, isAuthenticated])

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.orderDetail}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Pedido</p>
          <h1>Detalle del pedido</h1>
          <p className="muted">Revisa productos, estado y total de tu compra.</p>
        </section>

        {!isAuthenticated ? (
          <section className={`container ${styles.panel}`}>
            <h2>Necesitas iniciar sesión</h2>
            <p className="muted">Esta sección solo está disponible para usuarios autenticados.</p>
            <Link className="btn" to="/account">
              Ir a cuenta
            </Link>
          </section>
        ) : loading ? (
          <section className={`container ${styles.panel}`} role="status" aria-live="polite">
            <h2>Cargando pedido...</h2>
          </section>
        ) : error ? (
          <section className={`container ${styles.panel}`}>
            <p className="state-box state-error" role="alert" aria-live="assertive">
              {error}
            </p>
            <Link className="btn btn-outline" to="/account">
              Volver a cuenta
            </Link>
          </section>
        ) : !order ? (
          <section className={`container ${styles.panel}`}>
            <h2>Pedido no encontrado</h2>
            <Link className="btn btn-outline" to="/account">
              Volver a cuenta
            </Link>
          </section>
        ) : (
          <section className={`container ${styles.content}`}>
            <article className={styles.panel}>
              <h2>Resumen</h2>
              <p>
                <strong>Pedido:</strong> {order.id}
              </p>
              <p>
                <strong>Estado:</strong> {order.status}
              </p>
              <p>
                <strong>Fecha:</strong> {formatDate(order.createdAt)}
              </p>
              <p>
                <strong>Total:</strong> {formatMoney(order.total, order.currency)}
              </p>
              {order.status === 'failed' ? (
                <Link className="btn" to={`/checkout/${order.id}`}>
                  Reintentar pago
                </Link>
              ) : null}
            </article>

            <article className={styles.panel}>
              <h2>Productos</h2>
              <div className={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className={styles.itemRow}>
                    <div>
                      <h3>{item.name}</h3>
                      <p className="muted">{item.quantity} x {formatMoney(item.unitPrice, item.currency)}</p>
                    </div>
                    <p className={styles.itemTotal}>{formatMoney(item.lineTotal, item.currency)}</p>
                  </div>
                ))}
              </div>
              <Link className="btn btn-outline" to="/account">
                Volver a cuenta
              </Link>
            </article>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
