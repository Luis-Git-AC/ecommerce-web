import { Link } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.siteHeader}>
      <div className={`container ${styles.headerInner}`}>
        <Link className={styles.logo} to="/">
          <span className={styles.logoIcon} aria-hidden="true">
            <svg viewBox="0 0 40 40" role="img" focusable="false">
              <circle cx="20" cy="20" r="20" fill="#2e8b57" />
              <path
                d="M12.5 21.5c5-1.8 9-5.7 12.2-12.1 3.7 8.8 1.4 16.7-5.7 18.3-2.8.6-5.6.3-8.2-.5 2.5-.6 4.7-2.4 6-5.3-1.6.6-3.2.7-4.3-.4Z"
                fill="#ffffff"
              />
              <path d="M18 16.5c3.2 4.3 4 8.5 3 12" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          VerdeVivo
        </Link>
        <nav className={styles.nav}>
          <Link to="/">Inicio</Link>
          <Link to="/shop">Tienda</Link>
          <Link to="/club">Club</Link>
          <Link to="/blog">Blog</Link>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="Mi perfil">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button className={styles.iconBtn} aria-label="Carrito">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2ZM6.2 6h14.1l-1.4 7.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L4.3 3H2V1h3a1 1 0 0 1 1 .8Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
