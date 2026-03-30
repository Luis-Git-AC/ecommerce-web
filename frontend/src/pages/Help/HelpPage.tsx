import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './HelpPage.module.css'

const faqs = [
  {
    question: 'Como funciona el quiz?',
    answer: 'Respondes 4 preguntas y recibes recomendaciones segun tu luz, tiempo y experiencia.',
  },
  {
    question: 'Puedo cambiar mis preferencias?',
    answer: 'Si. Puedes ajustarlas cuando quieras y mejorar tus futuras recomendaciones.',
  },
  {
    question: 'Que hago si una planta llega en mal estado?',
    answer: 'Contactanos y gestionamos una solucion rapida.',
  },
]

export default function HelpPage() {
  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.help}>
        <section className="container page-hero">
          <p className="page-eyebrow">Ayuda</p>
          <h1>Resolvemos tus dudas antes de comprar</h1>
          <p className="muted">Respuestas rapidas para que compres con confianza.</p>
        </section>

        <section className={`container ${styles.content}`}>
          <div className={styles.card}>
            <h2>Preguntas frecuentes</h2>
            <div className={styles.faqGrid}>
              {faqs.map((item) => (
                <article key={item.question} className={styles.faqItem}>
                  <h3>{item.question}</h3>
                  <p className="muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.cta}>
            <div>
              <h2>Necesitas ayuda personalizada?</h2>
              <p className="muted">Escribe a nuestro equipo y respondemos en menos de 24 horas.</p>
            </div>
            <Link className="btn" to="/contact">Contactar</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
