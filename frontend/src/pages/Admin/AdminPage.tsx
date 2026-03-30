import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { ApiClientError } from '../../services/api.client'
import { adminRepository } from '../../services/admin.repository'
import { useAuth } from '../../store/AuthContext'
import type { AdminOrderSummary, AdminUserSummary } from '../../types/commerce'
import styles from './AdminPage.module.css'

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
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function AdminPage() {
  const { isAuthenticated, accessToken, session } = useAuth()
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || session?.user.role !== 'admin') {
      setUsers([])
      setOrders([])
      return
    }

    let canceled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const [usersData, ordersData] = await Promise.all([
          adminRepository.listUsers(accessToken, { page: 1, limit: 20 }),
          adminRepository.listOrders(accessToken, { page: 1, limit: 20 }),
        ])

        if (canceled) {
          return
        }

        setUsers(usersData.items)
        setOrders(ordersData.items)
      } catch (incomingError) {
        if (canceled) {
          return
        }

        if (incomingError instanceof ApiClientError) {
          setError(incomingError.message)
        } else if (incomingError instanceof Error) {
          setError(incomingError.message)
        } else {
          setError('No pudimos cargar el panel de administración.')
        }
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      canceled = true
    }
  }, [accessToken, session?.user.role])

  if (!isAuthenticated) {
    return (
      <div className="page brand-page">
        <Header />
        <main className={styles.admin}>
          <section className={`container ${styles.panel}`}>
            <h1>Área admin</h1>
            <p className="muted">Inicia sesión para acceder al panel.</p>
            <Link className="btn" to="/account">Ir a cuenta</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  if (session?.user.role !== 'admin') {
    return (
      <div className="page brand-page">
        <Header />
        <main className={styles.admin}>
          <section className={`container ${styles.panel}`}>
            <h1>Acceso restringido</h1>
            <p className="muted">Esta sección está disponible solo para administradores.</p>
            <Link className="btn btn-outline" to="/account">Volver a cuenta</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.admin}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Administración</p>
          <h1>Panel admin</h1>
          <p className="muted">Vista global de usuarios registrados y pedidos recientes.</p>
        </section>

        {loading ? (
          <section className={`container ${styles.panel}`} role="status" aria-live="polite">
            <p className="muted">Cargando datos administrativos...</p>
          </section>
        ) : null}

        {error ? (
          <section className={`container ${styles.panel}`}>
            <p className={styles.errorBox}>{error}</p>
          </section>
        ) : null}

        {!loading && !error ? (
          <section className={`container ${styles.grid}`}>
            <article className={styles.panel}>
              <h2>Usuarios ({users.length})</h2>
              <div className={styles.list}>
                {users.map((user) => (
                  <div key={user.id} className={styles.row}>
                    <div>
                      <p><strong>{user.name}</strong> · {user.role}</p>
                      <p className="muted">{user.email}</p>
                    </div>
                    <div className={styles.meta}>
                      <span>{user.ordersCount} pedidos</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <h2>Pedidos ({orders.length})</h2>
              <div className={styles.list}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.row}>
                    <div>
                      <p><strong>{order.id}</strong> · {order.status}</p>
                      <p className="muted">{order.user.email}</p>
                    </div>
                    <div className={styles.meta}>
                      <span>{order.totalItems} productos</span>
                      <span>{formatMoney(order.total, order.currency)}</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
