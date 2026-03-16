import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { ordersRepository } from '../../services/orders.repository'
import { ApiClientError } from '../../services/api.client'
import { useAuth } from '../../store/AuthContext'
import type { OrderSummary } from '../../types/commerce'
import styles from './AccountPage.module.css'

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `$${value}`
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

export default function AccountPage() {
  const { session, accessToken, isAuthenticated, login, register, logout } = useAuth()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setOrders([])
      setOrdersError(null)
      return
    }

    setOrdersLoading(true)
    setOrdersError(null)

    try {
      const data = await ordersRepository.list(accessToken, { page: 1, limit: 10 })
      setOrders(data.items)
    } catch (error) {
      if (error instanceof ApiClientError) {
        setOrdersError(error.message)
      } else if (error instanceof Error) {
        setOrdersError(error.message)
      } else {
        setOrdersError('No pudimos cargar tus pedidos.')
      }
    } finally {
      setOrdersLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([])
      return
    }

    void loadOrders()
  }, [isAuthenticated, loadOrders])

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage(null)
    setAuthError(null)

    try {
      await login({ email: loginEmail, password: loginPassword })
      setAuthMessage('Sesión iniciada correctamente.')
      setLoginPassword('')
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message)
      } else {
        setAuthError('No pudimos iniciar sesión.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const submitRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage(null)
    setAuthError(null)

    try {
      await register({ name: registerName, email: registerEmail, password: registerPassword })
      setAuthMessage('Cuenta creada. Tu sesión ya está activa.')
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message)
      } else {
        setAuthError('No pudimos crear tu cuenta.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    setAuthError(null)
    setAuthMessage(null)
    await logout()
    setOrders([])
  }

  return (
    <div className="page">
      <Header />
      <main className={styles.account}>
        <section className={`container ${styles.hero}`}>
          <p className="page-eyebrow">Cuenta</p>
          <h1>Cuenta y pedidos</h1>
          <p className="muted">Gestiona tu sesión y sigue tus compras sin salir de la web.</p>
        </section>

        {isAuthenticated && session ? (
          <section className={`container ${styles.panel}`}>
            <div className={styles.sessionHeader}>
              <div>
                <h2>{session.user.name}</h2>
                <p className="muted">{session.user.email}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>

            <div className={styles.ordersHeader}>
              <h3>Mis pedidos</h3>
              <button type="button" className="btn btn-outline" onClick={() => void loadOrders()} disabled={ordersLoading}>
                {ordersLoading ? 'Actualizando...' : 'Actualizar lista'}
              </button>
            </div>

            {ordersError ? <p className={styles.errorBox}>{ordersError}</p> : null}

            {ordersLoading ? (
              <p className="muted" role="status" aria-live="polite">
                Cargando pedidos...
              </p>
            ) : orders.length === 0 ? (
              <div className={styles.emptyState}>
                <p className="muted">Aún no tienes pedidos.</p>
                <Link to="/shop" className="btn">
                  Ir a tienda
                </Link>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <article key={order.id} className={styles.orderCard}>
                    <p>
                      <strong>Pedido:</strong> {order.id}
                    </p>
                    <p>
                      <strong>Estado:</strong> {order.status}
                    </p>
                    <p>
                      <strong>Total:</strong> {formatMoney(order.total, order.currency)}
                    </p>
                    <p>
                      <strong>Productos:</strong> {order.totalItems}
                    </p>
                    <p className="muted">{formatDate(order.createdAt)}</p>
                    <Link to={`/account/orders/${order.id}`} className="btn btn-outline">
                      Ver detalle
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className={`container ${styles.authGrid}`}>
            <form className={styles.panel} onSubmit={submitLogin} autoComplete="on">
              <h2>Iniciar sesión</h2>
              <label>
                Correo
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={8}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>
              <button type="submit" className="btn" disabled={authLoading}>
                {authLoading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>

            <form className={styles.panel} onSubmit={submitRegister} autoComplete="off">
              <h2>Crear cuenta</h2>
              <label>
                Nombre
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                />
              </label>
              <button type="submit" className="btn" disabled={authLoading}>
                {authLoading ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>

            {authMessage ? (
              <p className={styles.successBox} role="status" aria-live="polite">
                {authMessage}
              </p>
            ) : null}

            {authError ? (
              <p className={styles.errorBox} role="alert" aria-live="assertive">
                {authError}
              </p>
            ) : null}
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
