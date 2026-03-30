import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo2-trimmed.png'
import { useAuth } from '../../store/AuthContext'
import { useCart } from '../../store/CartContext'
import styles from './Header.module.css'

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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const cartButtonRef = useRef<HTMLButtonElement | null>(null)
  const cartDrawerRef = useRef<HTMLElement | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const previousCartFocusedElementRef = useRef<HTMLElement | null>(null)
  const lastScrollYRef = useRef(0)
  const lastCartScrollYRef = useRef(0)
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()
  const { totalItems, cart, loading: cartLoading } = useCart()
  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/shop', label: 'Tienda' },
    { to: '/club', label: 'Club' },
    { to: '/blog', label: 'Blog' },
    { to: '/account', label: 'Cuenta' },
  ]

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev
      if (next) {
        setCartDrawerOpen(false)
      }
      return next
    })
  }

  const toggleCartDrawer = () => {
    setCartDrawerOpen((prev) => {
      const next = !prev
      if (next) {
        setMenuOpen(false)
      }
      return next
    })
  }

  const closeMenu = () => setMenuOpen(false)
  const closeCartDrawer = () => setCartDrawerOpen(false)

  const isLinkActive = (to: string) => {
    if (to === '/') {
      return pathname === '/'
    }

    return pathname === to || pathname.startsWith(`${to}/`)
  }

  useEffect(() => {
    if (!menuOpen) {
      menuButtonRef.current?.focus()
      return
    }

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    lastScrollYRef.current = window.scrollY

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const menuButtonElement = menuButtonRef.current
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const focusablesSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const getMenuFocusables = () => {
      const menuFocusableElements = Array.from(
        mobileMenuRef.current?.querySelectorAll<HTMLElement>(focusablesSelector) ?? [],
      )

      const trigger = menuButtonElement
      if (!trigger) {
        return menuFocusableElements
      }

      return [trigger, ...menuFocusableElements]
    }

    window.requestAnimationFrame(() => {
      const menuFocusableElements = getMenuFocusables()
      const firstInteractive = menuFocusableElements[1] ?? menuFocusableElements[0]
      firstInteractive?.focus()
    })

    const handleScroll = () => {
      const nextScrollY = window.scrollY
      const didScrollDown = nextScrollY > lastScrollYRef.current

      lastScrollYRef.current = nextScrollY

      if (didScrollDown && nextScrollY > 8) {
        closeMenu()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusables = getMenuFocusables()
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow

      if (
        previousFocusedElementRef.current
        && previousFocusedElementRef.current !== document.body
        && previousFocusedElementRef.current !== menuButtonElement
      ) {
        previousFocusedElementRef.current.focus()
      }
    }
  }, [menuOpen])

  useEffect(() => {
    if (!cartDrawerOpen) {
      return
    }

    previousCartFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    lastCartScrollYRef.current = window.scrollY

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const cartButtonElement = cartButtonRef.current
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const focusablesSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const getDrawerFocusables = () => {
      const drawerFocusableElements = Array.from(
        cartDrawerRef.current?.querySelectorAll<HTMLElement>(focusablesSelector) ?? [],
      )

      const trigger = cartButtonElement
      if (!trigger) {
        return drawerFocusableElements
      }

      return [trigger, ...drawerFocusableElements]
    }

    window.requestAnimationFrame(() => {
      const drawerFocusableElements = getDrawerFocusables()
      const firstInteractive = drawerFocusableElements[1] ?? drawerFocusableElements[0]
      firstInteractive?.focus()
    })

    const handleScroll = () => {
      const nextScrollY = window.scrollY
      const didScrollDown = nextScrollY > lastCartScrollYRef.current

      lastCartScrollYRef.current = nextScrollY

      if (didScrollDown && nextScrollY > 8) {
        closeCartDrawer()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCartDrawer()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusables = getDrawerFocusables()
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow

      if (
        previousCartFocusedElementRef.current
        && previousCartFocusedElementRef.current !== document.body
        && previousCartFocusedElementRef.current !== cartButtonElement
      ) {
        previousCartFocusedElementRef.current.focus()
      }
    }
  }, [cartDrawerOpen])

  const previewItems = cart?.items.slice(0, 3) ?? []
  const remainingItems = Math.max(0, (cart?.items.length ?? 0) - previewItems.length)
  const cartCurrency = cart?.items[0]?.currency ?? 'EUR'
  const cartSubtotal = cart?.subtotal ?? 0
  const includedVatAmount = getIncludedVatAmount(cartSubtotal, VAT_RATE)

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
            <Link
              key={link.to}
              to={link.to}
              className={isLinkActive(link.to) ? styles.activeLink : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button
            className={`${styles.iconBtn} ${styles.menuButton}`}
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
            ref={menuButtonRef}
          >
            <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
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
          <button
            className={`${styles.iconBtn} ${styles.cartBtn} ${cartDrawerOpen ? styles.cartBtnOpen : ''}`}
            type="button"
            aria-label={cartDrawerOpen ? 'Cerrar resumen del carrito' : 'Abrir resumen del carrito'}
            aria-expanded={cartDrawerOpen}
            aria-controls="mini-cart-drawer"
            onClick={toggleCartDrawer}
            ref={cartButtonRef}
          >
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2ZM6.2 6h14.1l-1.4 7.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.6L4.3 3H2V1h3a1 1 0 0 1 1 .8Z"
                fill="currentColor"
              />
            </svg>
            {totalItems > 0 ? <span className={styles.cartBadge}>{totalItems}</span> : null}
          </button>
        </div>
      </div>
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}
        ref={mobileMenuRef}
      >
        <div className={styles.mobileMenuInner}>
          <p className={styles.mobileNavLabel}>Navegación</p>
          <nav className={styles.mobileNav}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${styles.mobileLink} ${isLinkActive(link.to) ? styles.mobileLinkActive : ''}`}
                onClick={closeMenu}
              >
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

      <aside
        id="mini-cart-drawer"
        className={`${styles.cartDrawer} ${cartDrawerOpen ? styles.cartDrawerOpen : ''}`}
        ref={cartDrawerRef}
        aria-hidden={!cartDrawerOpen}
      >
        <div className={styles.cartDrawerHeader}>
          <h3>Tu carrito</h3>
          <button
            type="button"
            className={styles.cartDrawerClose}
            onClick={closeCartDrawer}
            aria-label="Cerrar resumen del carrito"
          >
            ×
          </button>
        </div>

        {!isAuthenticated ? (
          <div className={styles.cartDrawerBody}>
            <p className="muted">Inicia sesión para ver y guardar tu carrito.</p>
            <Link to="/account" className="btn btn-outline" onClick={closeCartDrawer}>
              Ir a cuenta
            </Link>
          </div>
        ) : cartLoading ? (
          <div className={styles.cartDrawerBody}>
            <p className="muted">Cargando carrito...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className={styles.cartDrawerBody}>
            <p className="muted">Tu carrito está vacío.</p>
            <Link to="/shop" className="btn btn-outline" onClick={closeCartDrawer}>
              Ir a tienda
            </Link>
          </div>
        ) : (
          <div className={styles.cartDrawerBody}>
            <ul className={styles.cartPreviewList}>
              {previewItems.map((item) => (
                <li key={item.productId} className={styles.cartPreviewItem}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.cartPreviewImage}
                    loading="lazy"
                  />
                  <div className={styles.cartPreviewMeta}>
                    <p className={styles.cartPreviewName}>{item.name}</p>
                    <p className={styles.cartPreviewPrice}>
                      {item.quantity} x {formatMoney(item.unitPrice, item.currency)}
                    </p>
                  </div>
                  <p className={styles.cartPreviewLineTotal}>{formatMoney(item.lineTotal, item.currency)}</p>
                </li>
              ))}
            </ul>

            {remainingItems > 0 ? (
              <p className={styles.cartPreviewMore}>+{remainingItems} producto(s) más</p>
            ) : null}

            <div className={styles.cartDrawerSummary}>
              <span>Subtotal</span>
              <strong>{formatMoney(cartSubtotal, cartCurrency)}</strong>
            </div>

            <p className={styles.cartDrawerTax}>IVA incluido (21%): {formatMoney(includedVatAmount, cartCurrency, 2)}</p>

            <Link to="/cart" className="btn" onClick={closeCartDrawer}>
              Completar compra
            </Link>
          </div>
        )}
      </aside>

      <button
        className={`${styles.cartDrawerOverlay} ${cartDrawerOpen ? styles.cartDrawerOverlayOpen : ''}`}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={closeCartDrawer}
      />
    </header>
  )
}
