import { Link, useLocation } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import styles from './NotFoundPage.module.css'

const suggestions = [
  { to: '/shop', label: 'Ver el catálogo de plantas' },
  { to: '/blog', label: 'Leer guías de cuidados' },
  { to: '/club', label: 'Conocer el club' },
  { to: '/contact', label: 'Contactar con el equipo' },
]

export default function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="page brand-page">
      <Header />
      <main id="main-content" className={styles.notFound}>
        <section className={`container ${styles.panel}`}>
          <p className={styles.code}>Error 404</p>
          <h1>Esta página se nos ha marchitado</h1>
          <p className="muted">
            No encontramos nada en <code>{pathname}</code>. Puede que el enlace haya cambiado o que
            la dirección tenga alguna errata.
          </p>

          <div className={styles.actions}>
            <Link to="/" className="btn">
              Volver al inicio
            </Link>
            <Link to="/shop" className="btn btn-outline">
              Ir a la tienda
            </Link>
          </div>

          <nav aria-label="Sugerencias de navegación">
            <p className="muted">Quizá buscabas alguna de estas secciones:</p>
            <ul className={styles.suggestions}>
              {suggestions.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  )
}
