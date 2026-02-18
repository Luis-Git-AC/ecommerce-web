import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './LegalPage.module.css'

export default function CookiesPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.legal}>
        <section className={`container ${styles.hero}`}>
          <p className={styles.eyebrow}>Cookies</p>
          <h1>Politica de cookies</h1>
          <p className="muted">Contenido provisional.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <article className={styles.card}>
            <h2>Que son las cookies</h2>
            <p className="muted">Archivos que ayudan a mejorar la navegacion.</p>
          </article>
          <article className={styles.card}>
            <h2>Tipos de cookies</h2>
            <p className="muted">Usamos cookies esenciales y de analitica basica.</p>
          </article>
          <article className={styles.card}>
            <h2>Como gestionarlas</h2>
            <p className="muted">Puedes desactivarlas desde la configuracion de tu navegador.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
