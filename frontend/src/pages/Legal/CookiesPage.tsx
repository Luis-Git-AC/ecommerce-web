import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './LegalPage.module.css'

export default function CookiesPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.legal}>
        <section className="container page-hero">
          <p className="page-eyebrow">Cookies</p>
          <h1>Política de cookies</h1>
          <p className="muted">Usamos cookies para mejorar navegación, seguridad y medición básica.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <article className={styles.card}>
            <h2>Qué son las cookies</h2>
            <p className="muted">Archivos que ayudan a mejorar la navegación.</p>
          </article>
          <article className={styles.card}>
            <h2>Tipos de cookies</h2>
            <p className="muted">Usamos cookies esenciales y de analítica básica.</p>
          </article>
          <article className={styles.card}>
            <h2>Cómo gestionarlas</h2>
            <p className="muted">Puedes desactivarlas desde la configuración de tu navegador.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
