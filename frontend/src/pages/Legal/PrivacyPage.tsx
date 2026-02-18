import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './LegalPage.module.css'

export default function PrivacyPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.legal}>
        <section className={`container ${styles.hero}`}>
          <p className={styles.eyebrow}>Privacidad</p>
          <h1>Politica de privacidad</h1>
          <p className="muted">Contenido provisional.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <article className={styles.card}>
            <h2>Datos que recopilamos</h2>
            <p className="muted">Nombre, email y preferencias de compra cuando completas formularios.</p>
          </article>
          <article className={styles.card}>
            <h2>Uso de la informacion</h2>
            <p className="muted">Usamos los datos para gestionar pedidos y mejorar la experiencia.</p>
          </article>
          <article className={styles.card}>
            <h2>Derechos del usuario</h2>
            <p className="muted">Puedes solicitar modificacion o eliminacion de datos en cualquier momento.</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  )
}
