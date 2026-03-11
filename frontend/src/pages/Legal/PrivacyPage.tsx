import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './LegalPage.module.css'

export default function PrivacyPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.legal}>
        <section className="container page-hero">
          <p className="page-eyebrow">Privacidad</p>
          <h1>Política de privacidad</h1>
          <p className="muted">Te explicamos de forma clara qué datos usamos y para qué.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <article className={styles.card}>
            <h2>Datos que recopilamos</h2>
            <p className="muted">Nombre, email y preferencias de compra cuando completas formularios.</p>
          </article>
          <article className={styles.card}>
            <h2>Uso de la información</h2>
            <p className="muted">Usamos los datos para gestionar solicitudes y mejorar la experiencia.</p>
          </article>
          <article className={styles.card}>
            <h2>Derechos del usuario</h2>
            <p className="muted">Puedes solicitar modificación o eliminación de datos en cualquier momento.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
