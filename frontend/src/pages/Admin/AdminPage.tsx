import { useCallback, useEffect, useState } from 'react'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { ApiClientError } from '@/services/api.client'
import { adminRepository } from '@/services/admin.repository'
import { useAuth } from '@/store/AuthContext'
import {
  ALLOWED_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  type AdminContactMessage,
  type AdminOrderSummary,
  type AdminProduct,
  type AdminStats,
  type AdminUserSummary,
  type OrderStatus,
} from '@/types/commerce'
import { formatDate, formatMoney } from '@/utils/format'
import { AdminTableSkeleton, StatsSkeleton } from '@/components/ui/Skeletons'
import ProductFormPanel from './ProductFormPanel'
import styles from './AdminPage.module.css'

type Tab = 'stats' | 'products' | 'orders' | 'users' | 'messages'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'stats', label: 'Indicadores' },
  { id: 'products', label: 'Productos' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'users', label: 'Usuarios' },
  { id: 'messages', label: 'Mensajes' },
]

const toMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError || error instanceof Error ? error.message : fallback

export default function AdminPage() {
  const { accessToken } = useAuth()
  const [tab, setTab] = useState<Tab>('stats')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [messages, setMessages] = useState<AdminContactMessage[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loadTab = useCallback(
    async (target: Tab) => {
      if (!accessToken) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        if (target === 'stats') {
          setStats(await adminRepository.getStats(accessToken))
        } else if (target === 'products') {
          const page = await adminRepository.listProducts(accessToken, { page: 1, limit: 50 })
          setProducts(page.items)
        } else if (target === 'orders') {
          const page = await adminRepository.listOrders(accessToken, { page: 1, limit: 30 })
          setOrders(page.items)
        } else if (target === 'users') {
          const page = await adminRepository.listUsers(accessToken, { page: 1, limit: 30 })
          setUsers(page.items)
        } else {
          const page = await adminRepository.listContactMessages(accessToken, {
            page: 1,
            limit: 30,
          })
          setMessages(page.items)
        }
      } catch (incomingError) {
        setError(toMessage(incomingError, 'No pudimos cargar el panel de administración.'))
      } finally {
        setLoading(false)
      }
    },
    [accessToken],
  )

  useEffect(() => {
    void loadTab(tab)
  }, [loadTab, tab])

  const handleProductSaved = (saved: AdminProduct) => {
    setProducts((prev) => {
      const exists = prev.some((item) => item.id === saved.id)
      return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
    })
    setEditingProduct(saved.id === editingProduct?.id ? saved : null)
    setIsCreating(false)
    setNotice('Cambios guardados correctamente.')
  }

  const handleDeactivate = async (product: AdminProduct) => {
    if (!accessToken) {
      return
    }

    setError(null)
    setNotice(null)

    try {
      const updated = await adminRepository.deactivateProduct(accessToken, product.id)
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setNotice(`"${updated.name}" se ha dado de baja del catálogo.`)
    } catch (incomingError) {
      setError(toMessage(incomingError, 'No pudimos dar de baja el producto.'))
    }
  }

  const handleStatusChange = async (order: AdminOrderSummary, status: OrderStatus) => {
    if (!accessToken) {
      return
    }

    setError(null)
    setNotice(null)

    try {
      const updated = await adminRepository.updateOrderStatus(accessToken, order.id, status)
      setOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item)),
      )
      setNotice(`Pedido ${updated.id} → ${ORDER_STATUS_LABELS[updated.status]}.`)
    } catch (incomingError) {
      setError(toMessage(incomingError, 'No pudimos cambiar el estado del pedido.'))
    }
  }

  return (
    <div className="page brand-page">
      <Header />
      <main id="main-content" className={styles.admin}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Administración</p>
          <h1>Panel admin</h1>
          <p className="muted">Gestiona el catálogo, los pedidos y la actividad de la tienda.</p>
        </section>

        <section className={`container ${styles.tabsRow}`}>
          <div className={styles.tabs} role="tablist" aria-label="Secciones del panel">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
                onClick={() => {
                  setTab(item.id)
                  setNotice(null)
                  setError(null)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <section className={`container ${styles.panel}`}>
            <p className="state-box state-error" role="alert">
              {error}
            </p>
          </section>
        ) : null}

        {notice ? (
          <section className={`container ${styles.panel}`}>
            <p className="state-box state-success" role="status">
              {notice}
            </p>
          </section>
        ) : null}

        {loading ? (
          <section className={`container ${styles.panel}`}>
            {tab === 'stats' ? <StatsSkeleton /> : <AdminTableSkeleton rows={6} />}
          </section>
        ) : null}

        {!loading && tab === 'stats' && stats ? (
          <section className={`container ${styles.statsGrid}`}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Ingresos confirmados</p>
              <p className={styles.statValue}>
                {formatMoney(stats.revenue.total, stats.revenue.currency)}
              </p>
              <p className="muted">{stats.revenue.paidOrders} pedidos pagados</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Productos activos</p>
              <p className={styles.statValue}>{stats.totals.activeProducts}</p>
              <p className="muted">{stats.lowStockProducts} con stock bajo</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Usuarios</p>
              <p className={styles.statValue}>{stats.totals.totalUsers}</p>
              <p className="muted">{stats.newUsersLast30Days} nuevos (30 días)</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Pedidos totales</p>
              <p className={styles.statValue}>{stats.totals.totalOrders}</p>
              <div className={styles.statusBreakdown}>
                {Object.entries(stats.ordersByStatus).length === 0 ? (
                  <p className="muted">Sin pedidos todavía</p>
                ) : (
                  Object.entries(stats.ordersByStatus).map(([status, count]) => (
                    <span key={status} className={styles.statusBreakdownItem}>
                      <OrderStatusBadge status={status as OrderStatus} />
                      <span className={styles.statusBreakdownCount}>{count}</span>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={`${styles.panel} ${styles.statsWide}`}>
              <h2>Productos más vendidos</h2>
              {stats.topProducts.length === 0 ? (
                <p className="muted">Todavía no hay ventas confirmadas.</p>
              ) : (
                <div className={styles.list}>
                  {stats.topProducts.map((product) => (
                    <div key={product.slug} className={styles.row}>
                      <div>
                        <p>
                          <strong>{product.name}</strong>
                        </p>
                        <p className="muted">{product.slug}</p>
                      </div>
                      <div className={styles.meta}>
                        <span>{product.units} uds.</span>
                        <span>{formatMoney(product.revenue, stats.revenue.currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        ) : null}

        {!loading && tab === 'products' ? (
          <section className={`container ${styles.stack}`}>
            {isCreating || editingProduct ? (
              <ProductFormPanel
                accessToken={accessToken ?? ''}
                product={editingProduct}
                onSaved={handleProductSaved}
                onCancel={() => {
                  setEditingProduct(null)
                  setIsCreating(false)
                }}
              />
            ) : (
              <button type="button" className="btn" onClick={() => setIsCreating(true)}>
                Nuevo producto
              </button>
            )}

            <article className={styles.panel}>
              <h2>Catálogo ({products.length})</h2>
              <div className={styles.list}>
                {products.map((product) => (
                  <div key={product.id} className={styles.row}>
                    <div>
                      <p>
                        <strong>{product.name}</strong>
                        {product.isActive ? null : (
                          <span className={styles.badgeInactive}>Dado de baja</span>
                        )}
                        {product.isFeatured ? (
                          <span className={styles.badgeFeatured}>Destacado</span>
                        ) : null}
                      </p>
                      <p className="muted">
                        {product.slug} · {formatMoney(product.price, product.currency)} ·{' '}
                        {product.stock} uds.
                      </p>
                    </div>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setEditingProduct(product)
                          setIsCreating(false)
                        }}
                      >
                        Editar
                      </button>
                      {product.isActive ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => void handleDeactivate(product)}
                        >
                          Dar de baja
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {!loading && tab === 'orders' ? (
          <section className={`container ${styles.panel}`}>
            <h2>Pedidos ({orders.length})</h2>
            <div className={styles.list}>
              {orders.map((order) => {
                const nextStatuses = ALLOWED_STATUS_TRANSITIONS[order.status]

                return (
                  <div key={order.id} className={styles.row}>
                    <div>
                      <div className={styles.orderRowHead}>
                        <strong>{order.id}</strong>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="muted">
                        {order.user.email} · {order.totalItems} productos ·{' '}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className={styles.rowActions}>
                      <span>{formatMoney(order.total, order.currency)}</span>
                      {nextStatuses.length > 0 ? (
                        <select
                          aria-label={`Cambiar estado del pedido ${order.id}`}
                          value=""
                          onChange={(event) => {
                            const next = event.target.value as OrderStatus
                            if (next) {
                              void handleStatusChange(order, next)
                            }
                          }}
                        >
                          <option value="">Cambiar estado…</option>
                          {nextStatuses.map((status) => (
                            <option key={status} value={status}>
                              {ORDER_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="muted">Estado final</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'users' ? (
          <section className={`container ${styles.panel}`}>
            <h2>Usuarios ({users.length})</h2>
            <div className={styles.list}>
              {users.map((user) => (
                <div key={user.id} className={styles.row}>
                  <div>
                    <p>
                      <strong>{user.name}</strong> · {user.role}
                    </p>
                    <p className="muted">{user.email}</p>
                  </div>
                  <div className={styles.meta}>
                    <span>{user.ordersCount} pedidos</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'messages' ? (
          <section className={`container ${styles.panel}`}>
            <h2>Mensajes de contacto ({messages.length})</h2>
            {messages.length === 0 ? (
              <p className="muted">No hay mensajes todavía.</p>
            ) : (
              <div className={styles.list}>
                {messages.map((message) => (
                  <div key={message.id} className={styles.messageRow}>
                    <div className={styles.messageHeader}>
                      <strong>{message.name}</strong>
                      <span className="muted">{message.email}</span>
                      <span className="muted">{formatDate(message.createdAt)}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
