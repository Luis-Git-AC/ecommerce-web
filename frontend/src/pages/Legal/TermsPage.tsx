import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './LegalPage.module.css'

export default function TermsPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.legal}>
        <section className="container page-hero">
          <p className="page-eyebrow">Terminos</p>
          <h1>Terminos y condiciones</h1>
          <p className="muted">Contenido provisional.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <article className={styles.card}>
            <h2>Uso del sitio</h2>
            <p className="muted">Al navegar aceptas el uso responsable de la plataforma.</p>
          </article>
          <article className={styles.card}>
            <h2>Compras y suscripciones</h2>
            <p className="muted">Las condiciones de compra se confirman en el checkout.</p>
          </article>
          <article className={styles.card}>
            <h2>Limitacion de responsabilidad</h2>
            <p className="muted">La informacion es referencial y puede actualizarse sin previo aviso.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
