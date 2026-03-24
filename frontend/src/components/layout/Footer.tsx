import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { contentRepository } from '../../services/content.repository'
import styles from './Footer.module.css'

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [newsletterStatusType, setNewsletterStatusType] = useState<'success' | 'error' | null>(null)
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false)

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = newsletterEmail.trim()
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!isValidEmail) {
      setNewsletterMessage('Introduce un correo válido.')
      setNewsletterStatusType('error')
      return
    }

    try {
      setIsNewsletterSubmitting(true)
      setNewsletterMessage('')
      setNewsletterStatusType(null)
      await contentRepository.subscribeNewsletter({ email })
      setNewsletterMessage('Suscripción registrada. Te avisaremos con las próximas novedades.')
      setNewsletterStatusType('success')
      setNewsletterEmail('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar la suscripción.'
      setNewsletterMessage(message)
      setNewsletterStatusType('error')
    } finally {
      setIsNewsletterSubmitting(false)
    }
  }

  return (
    <footer className={styles.siteFooter}>
      <div className={`container ${styles.footerGrid}`}>
        <div>
          <div className={`${styles.logo} ${styles.footerLogo}`}>{'{ecommerce}'}</div>
          <p className={`muted ${styles.footerDescription}`}>
            Plantas de interior, kits y suscripciones para espacios vivos.
          </p>
        </div>
        <div className={styles.footerLinksDesktop}>
          <div>
            <h4>Explora</h4>
            <ul>
              <li><Link to="/shop">Tienda</Link></li>
              <li><Link to="/#quiz">Quiz de planta ideal</Link></li>
              <li><Link to="/club">Planes</Link></li>
            </ul>
          </div>
          <div>
            <h4>Compañía</h4>
            <ul>
              <li><Link to="/about">Sobre nosotros</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4>Soporte</h4>
            <ul>
              <li><Link to="/help">Ayuda</Link></li>
              <li><Link to="/shipping">Envíos</Link></li>
              <li><Link to="/contact">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className={`${styles.socials} ${styles.socialsDesktop}`}>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 2H8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Zm-4 3.5a4.5 4.5 0 1 1-4.5 4.5A4.5 4.5 0 0 1 12 8.5Zm0 2a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 12 10.5Zm5.2-2.9a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M4 3h4.5l4 5.6L17.4 3H21l-7 8.1L21.5 21H17l-4.6-6.3L6.7 21H3l7.4-8.6Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" role="img" focusable="false">
              <path
                d="M13.5 9H16V6h-2.5A4.5 4.5 0 0 0 9 10.5V12H7v3h2v6h3v-6h2.5l.5-3H12v-1.5A1.5 1.5 0 0 1 13.5 9Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>
        <div className={styles.footerLinksMobile}>
          <details className={styles.footerDetails}>
            <summary>Explora</summary>
            <ul>
              <li><Link to="/shop">Tienda</Link></li>
              <li><Link to="/#quiz">Quiz de planta ideal</Link></li>
              <li><Link to="/club">Planes</Link></li>
            </ul>
          </details>
          <details className={styles.footerDetails}>
            <summary>Compañía</summary>
            <ul>
              <li><Link to="/about">Sobre nosotros</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
            <div className={styles.socials}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path
                    d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 2H8a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Zm-4 3.5a4.5 4.5 0 1 1-4.5 4.5A4.5 4.5 0 0 1 12 8.5Zm0 2a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 12 10.5Zm5.2-2.9a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path
                    d="M4 3h4.5l4 5.6L17.4 3H21l-7 8.1L21.5 21H17l-4.6-6.3L6.7 21H3l7.4-8.6Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path
                    d="M13.5 9H16V6h-2.5A4.5 4.5 0 0 0 9 10.5V12H7v3h2v6h3v-6h2.5l.5-3H12v-1.5A1.5 1.5 0 0 1 13.5 9Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </details>
          <details className={styles.footerDetails}>
            <summary>Soporte</summary>
            <ul>
              <li><Link to="/help">Ayuda</Link></li>
              <li><Link to="/shipping">Envíos</Link></li>
              <li><Link to="/contact">Contacto</Link></li>
            </ul>
          </details>
          <details className={`${styles.footerDetails} ${styles.footerNewsletterMobile}`}>
            <summary>Newsletter</summary>
            <div className={styles.newsletterCard}>
              <div className={styles.newsletterCopy}>
                <span className={styles.newsletterTitle}>{'Newsletter {ecommerce}'}</span>
                <span className={styles.newsletterText}>Consejos breves de cuidado y novedades.</span>
              </div>
              <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Tu correo"
                  aria-label="Tu correo"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                />
                <button className={styles.newsletterButton} disabled={isNewsletterSubmitting}>
                  {isNewsletterSubmitting ? 'Enviando...' : 'Recibir novedades'}
                </button>
              </form>
            </div>
            {newsletterMessage ? (
              <p
                className={`${styles.newsletterStatus} ${newsletterStatusType === 'error' ? styles.newsletterStatusError : styles.newsletterStatusSuccess}`}
                role={newsletterStatusType === 'error' ? 'alert' : 'status'}
                aria-live={newsletterStatusType === 'error' ? 'assertive' : 'polite'}
              >
                {newsletterMessage}
              </p>
            ) : null}
          </details>
        </div>
      </div>
      <div className={`container ${styles.footerBottom}`}>
        <div className={styles.footerBar}>
          <div className={`${styles.newsletterRow} ${styles.footerNewsletterDesktop}`}>
            <div className={styles.newsletterCard}>
              <div className={styles.newsletterCopy}>
                <span className={styles.newsletterTitle}>{'Newsletter {ecommerce}'}</span>
                <span className={styles.newsletterText}>Consejos breves de cuidado y novedades.</span>
              </div>
              <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Tu correo"
                  aria-label="Tu correo"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                />
                <button className={styles.newsletterButton} disabled={isNewsletterSubmitting}>
                  {isNewsletterSubmitting ? 'Enviando...' : 'Recibir novedades'}
                </button>
              </form>
            </div>
          </div>
          {newsletterMessage ? (
            <p
              className={`${styles.newsletterStatus} ${newsletterStatusType === 'error' ? styles.newsletterStatusError : styles.newsletterStatusSuccess}`}
              role={newsletterStatusType === 'error' ? 'alert' : 'status'}
              aria-live={newsletterStatusType === 'error' ? 'assertive' : 'polite'}
            >
              {newsletterMessage}
            </p>
          ) : null}
          <p className="muted">{'© 2026 {ecommerce}. Todos los derechos reservados.'}</p>
          <div className={styles.legalLinks}>
            <Link to="/legal/privacy">Privacidad</Link>
            <span>·</span>
            <Link to="/legal/terms">Términos</Link>
            <span>·</span>
            <Link to="/legal/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
