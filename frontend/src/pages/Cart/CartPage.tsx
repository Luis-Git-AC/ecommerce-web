import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { ordersRepository } from '../../services/orders.repository'
import { ApiClientError } from '../../services/api.client'
import { useAuth } from '../../store/AuthContext'
import { useCart } from '../../store/CartContext'
import styles from './CartPage.module.css'

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

export default function CartPage() {
  const navigate = useNavigate()
  const { isAuthenticated, accessToken } = useAuth()
  const { cart, loading, error, updateItemQuantity, removeItem, clearCart, refreshCart } = useCart()

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null)

  const handleQuantityChange = async (productId: string, nextQuantity: number) => {
    setActionError(null)
    setCheckoutMessage(null)
    setCheckoutOrderId(null)
    setActionLoading(true)

    try {
      await updateItemQuantity(productId, nextQuantity)
    } catch (incomingError) {
      if (incomingError instanceof ApiClientError) {
        setActionError(incomingError.message)
      } else if (incomingError instanceof Error) {
        setActionError(incomingError.message)
      } else {
        setActionError('No pudimos actualizar la cantidad.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (productId: string) => {
    setActionError(null)
    setCheckoutMessage(null)
    setCheckoutOrderId(null)
    setActionLoading(true)

    try {
      await removeItem(productId)
    } catch (incomingError) {
      if (incomingError instanceof ApiClientError) {
        setActionError(incomingError.message)
      } else if (incomingError instanceof Error) {
        setActionError(incomingError.message)
      } else {
        setActionError('No pudimos quitar el producto del carrito.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleClear = async () => {
    setActionError(null)
    setCheckoutMessage(null)
    setCheckoutOrderId(null)
    setActionLoading(true)

    try {
      await clearCart()
    } catch (incomingError) {
      if (incomingError instanceof ApiClientError) {
        setActionError(incomingError.message)
      } else if (incomingError instanceof Error) {
        setActionError(incomingError.message)
      } else {
        setActionError('No pudimos vaciar tu carrito.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!accessToken) {
      setActionError('Debes iniciar sesión para crear un pedido.')
      return
    }

    setActionError(null)
    setCheckoutMessage(null)
    setCheckoutOrderId(null)
    setActionLoading(true)

    try {
      const order = await ordersRepository.create(accessToken)
      await refreshCart()
      setCheckoutMessage(`Pedido creado con éxito: ${order.id}`)
      setCheckoutOrderId(order.id)
      navigate(`/checkout/${order.id}`)
    } catch (incomingError) {
      if (incomingError instanceof ApiClientError) {
        if (incomingError.message.toLowerCase().includes('cart is empty')) {
          await refreshCart()
          setActionError('Tu carrito ya fue procesado. Actualizamos la vista.')
          return
        }

        setActionError(incomingError.message)
      } else if (incomingError instanceof Error) {
        setActionError(incomingError.message)
      } else {
        setActionError('No pudimos crear tu pedido.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="page">
      <Header />
      <main className={styles.cart}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Compra</p>
          <h1>Carrito</h1>
          <p className="muted">Revisa tus productos y confirma tu pedido en un solo paso.</p>
        </section>

        {!isAuthenticated ? (
          <section className={`container ${styles.panel}`}>
            <h2>Tu carrito está protegido</h2>
            <p className="muted">Inicia sesión para guardar productos y generar pedidos.</p>
            <Link to="/account" className="btn">
              Iniciar sesión
            </Link>
          </section>
        ) : loading ? (
          <section className={`container ${styles.panel}`} role="status" aria-live="polite">
            <h2>Cargando carrito...</h2>
            <p className="muted">Estamos sincronizando tu sesión.</p>
          </section>
        ) : (
          <section className={`container ${styles.content}`}>
            <div className={styles.items}>
              {error ? <p className={styles.errorBox}>{error}</p> : null}
              {actionError ? <p className={styles.errorBox}>{actionError}</p> : null}
              {checkoutMessage ? <p className={styles.successBox}>{checkoutMessage}</p> : null}
              {checkoutOrderId ? (
                <Link to={`/checkout/${checkoutOrderId}`} className="btn">
                  Ir al pago
                </Link>
              ) : null}

              {!cart || cart.items.length === 0 ? (
                <div className={styles.panel}>
                  <h2>Tu carrito está vacío</h2>
                  <p className="muted">Agrega productos desde la tienda para continuar.</p>
                  <Link to="/shop" className="btn">
                    Ir a tienda
                  </Link>
                </div>
              ) : (
                cart.items.map((item) => (
                  <article key={item.productId} className={styles.itemCard}>
                    <div>
                      <h3>{item.name}</h3>
                      <p className="muted">{formatMoney(item.unitPrice, item.currency)} c/u</p>
                      <p className={styles.lineTotal}>{formatMoney(item.lineTotal, item.currency)}</p>
                    </div>

                    <div className={styles.itemControls}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void handleQuantityChange(item.productId, item.quantity - 1)}
                        disabled={actionLoading}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void handleQuantityChange(item.productId, item.quantity + 1)}
                        disabled={actionLoading}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => void handleRemove(item.productId)}
                        disabled={actionLoading}
                      >
                        Quitar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <aside className={styles.summary}>
              <h2>Resumen</h2>
              <p>
                <strong>Productos:</strong> {cart?.totalItems ?? 0}
              </p>
              <p>
                <strong>Subtotal:</strong> {formatMoney(cart?.subtotal ?? 0, cart?.items[0]?.currency ?? 'EUR')}
              </p>
              <p className={styles.totalLine}>
                <strong>Total:</strong> {formatMoney(cart?.total ?? 0, cart?.items[0]?.currency ?? 'EUR')}
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void handleCreateOrder()}
                  disabled={!cart || cart.items.length === 0 || actionLoading}
                >
                  {actionLoading ? 'Procesando...' : 'Crear pedido'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void handleClear()}
                  disabled={!cart || cart.items.length === 0 || actionLoading}
                >
                  Vaciar carrito
                </button>
                <Link to="/account" className="btn btn-outline">
                  Ver mi cuenta
                </Link>
              </div>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
