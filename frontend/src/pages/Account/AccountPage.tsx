import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import OrderCard from '@/components/ui/OrderCard'
import { OrderListSkeleton } from '@/components/ui/Skeletons'
import { ordersRepository } from '@/services/orders.repository'
import { ApiClientError } from '@/services/api.client'
import { useAuth } from '@/store/AuthContext'
import type { OrderSummary } from '@/types/commerce'
import styles from './AccountPage.module.css'

const ORDERS_PAGE_SIZE = 10

export default function AccountPage() {
  const { session, accessToken, isAuthenticated, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = (location.state as { from?: string } | null)?.from

  const goToOriginalDestination = useCallback(() => {
    if (redirectTo && redirectTo !== '/account') {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, redirectTo])

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
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [ordersLoadingMore, setOrdersLoadingMore] = useState(false)

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setOrders([])
      setOrdersPage(1)
      setOrdersTotalPages(1)
      setOrdersError(null)
      return
    }

    setOrdersLoading(true)
    setOrdersError(null)

    try {
      const data = await ordersRepository.list(accessToken, { page: 1, limit: ORDERS_PAGE_SIZE })
      setOrders(data.items)
      setOrdersPage(data.page)
      setOrdersTotalPages(data.totalPages)
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
      goToOriginalDestination()
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

  const loadMoreOrders = useCallback(async () => {
    if (!accessToken) return

    setOrdersLoadingMore(true)
    setOrdersError(null)

    try {
      const data = await ordersRepository.list(accessToken, {
        page: ordersPage + 1,
        limit: ORDERS_PAGE_SIZE,
      })
      setOrders((prev) => [...prev, ...data.items])
      setOrdersPage(data.page)
      setOrdersTotalPages(data.totalPages)
    } catch (error) {
      if (error instanceof ApiClientError) {
        setOrdersError(error.message)
      } else if (error instanceof Error) {
        setOrdersError(error.message)
      } else {
        setOrdersError('No pudimos cargar más pedidos.')
      }
    } finally {
      setOrdersLoadingMore(false)
    }
  }, [accessToken, ordersPage])

  const handleLogout = async () => {
    setAuthError(null)
    setAuthMessage(null)
    await logout()
    setOrders([])
    setOrdersPage(1)
    setOrdersTotalPages(1)
  }

  return (
    <div className="page brand-page">
      <Header />
      <main id="main-content" className={styles.account}>
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
              <div className={styles.ordersHeading}>
                <h3>Mis pedidos</h3>
                {orders.length > 0 ? (
                  <p className={styles.ordersCount}>
                    {orders.length === 1 ? '1 pedido' : `${orders.length} pedidos`}
                  </p>
                ) : null}
              </div>
              <div className={styles.ordersActions}>
                {session.user.role === 'admin' ? (
                  <Link to="/admin" className="btn btn-outline">
                    Panel admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void loadOrders()}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>

            {ordersError ? (
              <p className={`${styles.feedbackFull} state-box state-error`}>{ordersError}</p>
            ) : null}

            {ordersLoading ? (
              <OrderListSkeleton count={3} />
            ) : orders.length === 0 ? (
              <div className="state-empty">
                <p className="muted">Aún no tienes pedidos.</p>
                <Link to="/shop" className="btn">
                  Ir a tienda
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                {orders.length > 0 && ordersPage < ordersTotalPages ? (
                  <div className={styles.loadMoreRow}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => void loadMoreOrders()}
                      disabled={ordersLoadingMore}
                    >
                      {ordersLoadingMore ? 'Cargando...' : 'Cargar más pedidos'}
                    </button>
                  </div>
                ) : null}
              </>
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
              <p
                className={`${styles.feedbackFull} state-box state-success`}
                role="status"
                aria-live="polite"
              >
                {authMessage}
              </p>
            ) : null}

            {authError ? (
              <p
                className={`${styles.feedbackFull} state-box state-error`}
                role="alert"
                aria-live="assertive"
              >
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
