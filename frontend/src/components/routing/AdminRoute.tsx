import { Link, Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { useAuth } from '@/store/AuthContext'

type AdminRouteProps = {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/account" replace state={{ from: location.pathname + location.search }} />
  }

  if (session?.user.role !== 'admin') {
    return (
      <div className="page brand-page">
        <Header />
        <main id="main-content">
          <section className="container page-hero">
            <p className="page-eyebrow">Administración</p>
            <h1>Acceso restringido</h1>
            <p className="muted">Esta sección está disponible solo para administradores.</p>
            <p>
              <Link className="btn btn-outline" to="/account">
                Volver a mi cuenta
              </Link>
            </p>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return <>{children}</>
}
