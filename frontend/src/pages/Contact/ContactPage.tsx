import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './ContactPage.module.css'

export default function ContactPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.contact}>
        <section className={`container ${styles.hero}`}>
          <p className={styles.eyebrow}>Contacto</p>
          <h1>Estamos aqui para ayudarte</h1>
          <p className="muted">Escribenos y respondemos en menos de 24 horas.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name">Nombre</label>
              <input id="name" type="text" placeholder="Tu nombre" />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className={styles.field}>
              <label htmlFor="message">Mensaje</label>
              <textarea id="message" rows={4} placeholder="Como podemos ayudarte?" />
            </div>
            <button className="btn" type="button">Enviar mensaje</button>
          </form>

          <div className={styles.info}>
            <h2>Datos de contacto</h2>
            <p className="muted">hola@verdevivo.com</p>
            <p className="muted">+34 900 123 456</p>
            <p className="muted">Madrid, ES</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
