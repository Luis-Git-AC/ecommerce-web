import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import OrderProgress from '@/components/ui/OrderProgress'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { OrderListSkeleton } from '@/components/ui/Skeletons'
import { ApiClientError } from '@/services/api.client'
import { ordersRepository } from '@/services/orders.repository'
import { useAuth } from '@/store/AuthContext'
import type { OrderDetail } from '@/types/commerce'
import styles from './OrderDetailPage.module.css'
import { formatMoney, formatDate } from '@/utils/format'
import { formatOrderItemCount, formatOrderRef } from '@/utils/order'

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
      <main id="main-content" className={styles.orderDetail}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Pedido</p>
          <h1>Detalle del pedido</h1>
          <p className="muted">Revisa productos, estado y total de tu compra.</p>
        </section>

        {/* La comprobacion de sesion vive en ProtectedRoute (App.tsx). */}
        {loading ? (
          <section className={`container ${styles.panel}`}>
            <OrderListSkeleton count={2} />
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
              <div className={styles.summaryHead}>
                <OrderStatusBadge status={order.status} size="lg" />
                <div className={styles.summaryTotal}>
                  <p className={styles.totalLabel}>Total</p>
                  <span className={styles.totalValue}>
                    {formatMoney(order.total, order.currency)}
                  </span>
                </div>
              </div>

              <div className={styles.timeline}>
                <OrderProgress status={order.status} />
              </div>

              {order.status === 'pending' ? (
                <div className={`${styles.callout} ${styles.calloutPending}`}>
                  <p className={styles.calloutText}>
                    Este pedido está reservado pero aún no se ha pagado.
                  </p>
                  <Link className="btn" to={`/checkout/${order.id}`}>
                    Completar el pago
                  </Link>
                </div>
              ) : null}

              {order.status === 'failed' ? (
                <div className={`${styles.callout} ${styles.calloutNegative}`}>
                  <p className={styles.calloutText}>
                    {order.paymentLastError
                      ? `El pago no se completó: ${order.paymentLastError}`
                      : 'El pago no se completó.'}
                  </p>
                  <Link className="btn" to={`/checkout/${order.id}`}>
                    Reintentar pago
                  </Link>
                </div>
              ) : null}

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <p className={styles.metaLabel}>Referencia</p>
                  <p className={`${styles.metaValue} ${styles.metaRef}`}>
                    {formatOrderRef(order.id)}
                  </p>
                </div>
                <div className={styles.metaItem}>
                  <p className={styles.metaLabel}>Fecha del pedido</p>
                  <p className={styles.metaValue}>{formatDate(order.createdAt)}</p>
                </div>
                {order.paidAt ? (
                  <div className={styles.metaItem}>
                    <p className={styles.metaLabel}>Pagado el</p>
                    <p className={styles.metaValue}>{formatDate(order.paidAt)}</p>
                  </div>
                ) : null}
                <div className={styles.metaItem}>
                  <p className={styles.metaLabel}>Artículos</p>
                  <p className={styles.metaValue}>
                    {formatOrderItemCount(
                      order.items.reduce((total, item) => total + item.quantity, 0),
                    )}
                  </p>
                </div>
              </div>
            </article>

            <article className={styles.panel}>
              <h2>Productos</h2>
              <div className={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className={styles.itemRow}>
                    <img
                      className={styles.itemImage}
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>
                        <Link className={styles.itemNameLink} to={`/product/${item.slug}`}>
                          {item.name}
                        </Link>
                      </h3>
                      <p className={styles.itemMeta}>
                        {item.quantity} × {formatMoney(item.unitPrice, item.currency)}
                      </p>
                    </div>
                    <p className={styles.itemTotal}>{formatMoney(item.lineTotal, item.currency)}</p>
                  </div>
                ))}
              </div>

              <div className={styles.totals}>
                <div className={styles.totalsRow}>
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div className={`${styles.totalsRow} ${styles.totalsRowStrong}`}>
                  <span>Total</span>
                  <span>{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </article>

            {order.shippingAddress ? (
              <article className={styles.panel}>
                <h2>Envío</h2>
                <address className={styles.address}>
                  <span className={styles.addressName}>{order.shippingAddress.fullName}</span>
                  <span>{order.shippingAddress.line1}</span>
                  {order.shippingAddress.line2 ? <span>{order.shippingAddress.line2}</span> : null}
                  <span>
                    {order.shippingAddress.postalCode} {order.shippingAddress.city} (
                    {order.shippingAddress.province})
                  </span>
                  <span>{order.shippingAddress.country}</span>
                  <span className={styles.addressPhone}>{order.shippingAddress.phone}</span>
                </address>
              </article>
            ) : null}

            <div className={styles.backRow}>
              <Link className="btn btn-outline" to="/account">
                Volver a mis pedidos
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
