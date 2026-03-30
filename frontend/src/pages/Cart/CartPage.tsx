import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { ordersRepository } from '../../services/orders.repository'
import { ApiClientError } from '../../services/api.client'
import { useAuth } from '../../store/AuthContext'
import { useCart } from '../../store/CartContext'
import styles from './CartPage.module.css'

const formatMoney = (value: number, currency: string, maximumFractionDigits = 0) => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits,
    }).format(value)
  } catch {
    return `${value} EUR`
  }
}

const VAT_RATE = 0.21

const getIncludedVatAmount = (grossTotal: number, vatRate: number) => {
  if (grossTotal <= 0) {
    return 0
  }

  return grossTotal * (vatRate / (1 + vatRate))
}

export default function CartPage() {
  const SWIPE_REVEAL_PX = 96
  const SWIPE_THRESHOLD_PX = 36

  const navigate = useNavigate()
  const { isAuthenticated, accessToken } = useAuth()
  const { cart, loading, error, updateItemQuantity, removeItem, clearCart, refreshCart } = useCart()

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [checkoutOrderId, setCheckoutOrderId] = useState<string | null>(null)
  const [swipeItemId, setSwipeItemId] = useState<string | null>(null)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [pendingRemoval, setPendingRemoval] = useState<{ productId: string; productName: string } | null>(null)

  const touchStartXRef = useRef(0)
  const touchBaseOffsetRef = useRef(0)
  const cartCurrency = cart?.items[0]?.currency ?? 'EUR'
  const cartTotal = cart?.total ?? 0
  const includedVatAmount = getIncludedVatAmount(cartTotal, VAT_RATE)

  useEffect(() => {
    const shouldLock = pendingRemoval !== null
    if (!shouldLock) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [pendingRemoval])

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

  const handleSwipeStart = (productId: string, event: TouchEvent<HTMLDivElement>) => {
    if (swipeItemId && swipeItemId !== productId) {
      setSwipeItemId(null)
    }
    touchStartXRef.current = event.touches[0]?.clientX ?? 0
    const baseOffset = swipeItemId === productId ? -SWIPE_REVEAL_PX : 0
    touchBaseOffsetRef.current = baseOffset
    setDragOffset(baseOffset)
    setDraggingItemId(productId)
  }

  const handleSwipeMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!draggingItemId) {
      return
    }

    const nextX = event.touches[0]?.clientX ?? 0
    const delta = nextX - touchStartXRef.current
    const nextOffset = Math.max(-SWIPE_REVEAL_PX, Math.min(0, touchBaseOffsetRef.current + delta))
    setDragOffset(nextOffset)
  }

  const handleSwipeEnd = (productId: string) => {
    const shouldOpen = dragOffset <= -SWIPE_THRESHOLD_PX
    setSwipeItemId(shouldOpen ? productId : null)
    setDraggingItemId(null)
    setDragOffset(0)
  }

  const handleRequestRemove = (productId: string, productName: string) => {
    setPendingRemoval({ productId, productName })
  }

  const handleConfirmRemove = async () => {
    if (!pendingRemoval) {
      return
    }

    await handleRemove(pendingRemoval.productId)
    setSwipeItemId(null)
    setPendingRemoval(null)
  }

  const handleCancelRemove = () => {
    setPendingRemoval(null)
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
    <div className="page brand-page">
      <Header />
      <main className={styles.cart}>
        <section className={`container ${styles.hero}`}>
          <h1>Carrito</h1>
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
              {error ? <p className="state-box state-error">{error}</p> : null}
              {actionError ? <p className="state-box state-error">{actionError}</p> : null}
              {checkoutMessage ? <p className="state-box state-success">{checkoutMessage}</p> : null}
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
                <>
                  <div className={styles.desktopTableHead} aria-hidden="true">
                    <span>Producto</span>
                    <span>Precio</span>
                    <span>Cantidad</span>
                    <span>Subtotal</span>
                  </div>

                  {cart.items.map((item) => (
                    <article key={item.productId} className={styles.itemSwipeShell}>
                      <div
                        className={styles.itemCard}
                        onTouchStart={(event) => handleSwipeStart(item.productId, event)}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={() => handleSwipeEnd(item.productId)}
                        onTouchCancel={() => handleSwipeEnd(item.productId)}
                      >
                        <div className={styles.itemMain}>
                          <button
                            type="button"
                            className={styles.desktopRemoveButton}
                            onClick={() => handleRequestRemove(item.productId, item.name)}
                            disabled={actionLoading}
                            aria-label={`Quitar ${item.name} del carrito`}
                          >
                            <span className={styles.desktopRemoveGlyph} aria-hidden="true">
                              ×
                            </span>
                          </button>

                          <img
                            src={item.image}
                            alt={item.name}
                            className={styles.itemThumb}
                            loading="lazy"
                            onError={(event) => {
                              const target = event.currentTarget
                              target.style.visibility = 'hidden'
                            }}
                          />

                          <div className={styles.itemInfo}>
                            <h3>{item.name}</h3>
                            <p className={styles.lineTotalInline}>{formatMoney(item.lineTotal, item.currency)}</p>
                          </div>
                        </div>

                        <p className={styles.unitPrice}>{formatMoney(item.unitPrice, item.currency)}</p>

                        <div className={styles.itemSide}>
                          <div className={styles.itemTopRow}>
                            <p className={styles.lineTotal}>{formatMoney(item.lineTotal, item.currency)}</p>
                          </div>

                          <div className={styles.itemControls}>
                            <div className={styles.itemControlsSwipeShell}>
                              <div
                                className={`${styles.swipeAction} ${swipeItemId === item.productId || draggingItemId === item.productId ? styles.swipeActionVisible : ''}`}
                                aria-hidden={swipeItemId !== item.productId && draggingItemId !== item.productId}
                              >
                                <button
                                  type="button"
                                  className={styles.swipeDeleteButton}
                                  onClick={() => handleRequestRemove(item.productId, item.name)}
                                  disabled={actionLoading}
                                  aria-label={`Eliminar ${item.name} del carrito`}
                                >
                                  <svg className={styles.swipeDeleteIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path
                                      d="M9 3.75h6m-8.25 2.5h10.5m-9 0 .6 12a1.5 1.5 0 0 0 1.5 1.42h3.3a1.5 1.5 0 0 0 1.5-1.42l.6-12m-5.1 2.6v7.2m3.3-7.2v7.2"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>

                              <div
                                className={`${styles.itemControlsTrack} ${draggingItemId === item.productId ? styles.itemControlsTrackDragging : ''}`}
                                style={{ transform: `translateX(${draggingItemId === item.productId ? dragOffset : swipeItemId === item.productId ? -SWIPE_REVEAL_PX : 0}px)` }}
                              >
                                <div className={styles.quantityStepper}>
                                  <button
                                    type="button"
                                    className={styles.quantityButton}
                                    onClick={() => void handleQuantityChange(item.productId, item.quantity - 1)}
                                    disabled={actionLoading}
                                    aria-label={`Reducir cantidad de ${item.name}`}
                                  >
                                    -
                                  </button>
                                  <span className={styles.itemQuantity}>{item.quantity}</span>
                                  <button
                                    type="button"
                                    className={styles.quantityButton}
                                    onClick={() => void handleQuantityChange(item.productId, item.quantity + 1)}
                                    disabled={actionLoading}
                                    aria-label={`Aumentar cantidad de ${item.name}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className={styles.subtotalPrice}>{formatMoney(item.lineTotal, item.currency)}</p>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>

            <aside className={styles.summary}>
              <h2>Resumen</h2>
              <p>
                <strong>Productos:</strong> {cart?.totalItems ?? 0}
              </p>
              <p>
                <strong>Subtotal:</strong> {formatMoney(cart?.subtotal ?? 0, cartCurrency)}
              </p>
              <p className="muted">
                IVA incluido (21%): {formatMoney(includedVatAmount, cartCurrency, 2)}
              </p>
              <p className={styles.totalLine}>
                <strong>Total:</strong> {formatMoney(cartTotal, cartCurrency)}
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

        {pendingRemoval ? (
          <div className={styles.confirmOverlay} role="presentation" onClick={handleCancelRemove}>
            <div
              className={styles.confirmDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-item-title"
              aria-describedby="remove-item-desc"
              onClick={(event) => event.stopPropagation()}
            >
              <p className={styles.confirmEyebrow}>Confirmar eliminacion</p>
              <h3 id="remove-item-title">Eliminar producto</h3>
              <p id="remove-item-desc" className="muted">
                Se eliminara <strong>{pendingRemoval.productName}</strong> del carrito. Esta accion no se puede deshacer.
              </p>
              <div className={styles.confirmActions}>
                <button type="button" className="btn btn-ghost" onClick={handleCancelRemove} disabled={actionLoading}>
                  Cancelar
                </button>
                <button type="button" className="btn" onClick={() => void handleConfirmRemove()} disabled={actionLoading}>
                  {actionLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
