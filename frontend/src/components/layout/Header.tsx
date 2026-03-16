import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo2-trimmed.png'
import { useAuth } from '../../store/AuthContext'
import { useCart } from '../../store/CartContext'
import styles from './Header.module.css'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { totalItems } = useCart()
  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/shop', label: 'Tienda' },
    { to: '/club', label: 'Club' },
    { to: '/blog', label: 'Blog' },
    { to: '/account', label: 'Cuenta' },
    { to: '/cart', label: 'Carrito' },
  ]

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    const handleScroll = () => {
      closeMenu()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header className={styles.siteHeader}>
      <div className={`container ${styles.headerInner}`}>
        <Link className={styles.logo} to="/">
          <span className={styles.logoIcon} aria-hidden="true">
            <img src={logo} alt="" />
          </span>
          {/* Name */}
        </Link>
        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button
            className={`${styles.iconBtn} ${styles.menuButton}`}
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
          >
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <Link className={`${styles.iconBtn} ${styles.iconLink}`} to="/account" aria-label="Mi perfil">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                fill="currentColor"
              />
            </svg>
          </Link>
          <Link className={`${styles.iconBtn} ${styles.iconLink} ${styles.cartBtn}`} to="/cart" aria-label="Carrito">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2ZM6.2 6h14.1l-1.4 7.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L4.3 3H2V1h3a1 1 0 0 1 1 .8Z"
                fill="currentColor"
              />
            </svg>
            {totalItems > 0 ? <span className={styles.cartBadge}>{totalItems}</span> : null}
          </Link>
        </div>
      </div>
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
      >
        <div className={styles.mobileMenuInner}>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={styles.mobileLink} onClick={closeMenu}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <span className={styles.mobileSessionHint} aria-live="polite">
                Sesión activa
              </span>
            ) : null}
          </nav>
        </div>
      </div>
      <button
        className={`${styles.menuOverlay} ${menuOpen ? styles.menuOverlayOpen : ''}`}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={closeMenu}
      />
    </header>
  )
}
