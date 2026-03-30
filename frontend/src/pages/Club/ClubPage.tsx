import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import ClubHeroSection from '../../components/sections/ClubHeroSection'
import { contentRepository } from '../../services/content.repository'
import boxMedioPreview from '../../assets/club/box-medio-preview.png'
import styles from './ClubPage.module.css'

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: '14 €/mes',
    description: 'Una planta seleccionada para tu espacio.',
    features: ['1 planta al mes', 'Guía de cuidado', 'Ajustes de preferencias'],
  },
  {
    id: 'medio',
    name: 'Medio',
    price: '27 €/mes',
    description: 'Más variedad y accesorios esenciales.',
    features: ['2 plantas al mes', 'Kit de cuidado', 'Soporte prioritario'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '39 €/mes',
    description: 'Experiencia completa y personalización total.',
    features: ['3 plantas al mes', 'Accesorios premium', 'Personalización avanzada'],
  },
]

const steps = [
  {
    title: 'Cuestionario rápido',
    description: 'Nos cuentas tu luz, tiempo y experiencia.',
  },
  {
    title: 'Selección personalizada',
    description: 'Elegimos plantas compatibles con tu entorno.',
  },
  {
    title: 'Caja mensual',
    description: 'Recibes tu planta lista para tu hogar.',
  },
]

const faqs = [
  {
    question: '¿Puedo pausar o cancelar cuando quiera?',
    answer: 'Sí. Puedes gestionar la suscripción desde tu perfil en cualquier momento.',
  },
  {
    question: '¿Qué pasa si una planta no encaja?',
    answer: 'Puedes ajustar preferencias y solicitar un cambio en la siguiente caja.',
  },
  {
    question: '¿Recibiré una planta repetida?',
    answer: 'No. Priorizamos variedad y evitamos duplicados en tus envíos.',
  },
]

export default function ClubPage() {
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPlan, setLeadPlan] = useState<'basic' | 'medio' | 'premium'>('medio')
  const [leadStatus, setLeadStatus] = useState('')
  const [leadStatusType, setLeadStatusType] = useState<'success' | 'error' | null>(null)
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = leadName.trim()
    const email = leadEmail.trim()
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!name || !isValidEmail) {
      setLeadStatus('Completa nombre y un correo válido para registrarte.')
      setLeadStatusType('error')
      return
    }

    try {
      setIsLeadSubmitting(true)
      setLeadStatus('')
      setLeadStatusType(null)

      await contentRepository.createClubLead({
        name,
        email,
        plan: leadPlan,
      })

      setLeadStatus('Listo. Te contactaremos con una propuesta de plan personalizada.')
      setLeadStatusType('success')
      setLeadName('')
      setLeadEmail('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar tu interés.'
      setLeadStatus(message)
      setLeadStatusType('error')
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.club}>
        <ClubHeroSection />

        <section id="como-funciona" className={`container ${styles.steps}`}>
          <div className={styles.sectionHeader}>
            <h2>Cómo funciona</h2>
            <p className="muted">Un flujo simple para recibir plantas que encajan contigo.</p>
          </div>
          <div className={styles.stepGrid}>
            {steps.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <div className={styles.stepIndex}>{index + 1}</div>
                <h3>{step.title}</h3>
                <p className="muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planes" className={`container ${styles.plans}`}>
          <div className={styles.sectionHeader}>
            <h2>Planes del club</h2>
            <p className="muted">Elige el nivel que mejor se adapte a tu ritmo.</p>
          </div>
          <div className={styles.planGrid}>
            {plans.map((plan) => (
              <article key={plan.id} className={styles.planCard}>
                <div>
                  <h3>{plan.name}</h3>
                  <p className={styles.price}>{plan.price}</p>
                  <p className="muted">{plan.description}</p>
                  <ul className={styles.featureList}>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <Link className="btn" to={`/contact?plan=${plan.id}`}>Empezar</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={`container ${styles.preview}`}>
          <div>
            <h2>Vista previa de la caja</h2>
            <p className="muted">Incluye planta, guía de cuidado y detalles que facilitan el mantenimiento.</p>
          </div>
          <div className={styles.previewCard}>
            <img src={boxMedioPreview} alt="Caja Medio del Club" className={styles.previewCardImage} />
            <div className={styles.previewCardContent}>
              <h3>Plan Medio - Contenido del mes</h3>
              <p className="muted">Selección personalizada adaptada a tu espacio y experiencia.</p>
              <ul className={styles.previewList}>
                <li>2 plantas variadas mensualmente</li>
                <li>Kit de cuidado (herramientas + nutrientes)</li>
                <li>Guía práctica por niveles (PDF)</li>
                <li>Soporte prioritario en cambios</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={`container ${styles.leadSection}`}>
          <div className={styles.sectionHeader}>
            <h2>Únete a nuestro club</h2>
            <p className="muted">Crea tu perfil y comienza a recibir plantas seleccionadas mensualmente.</p>
          </div>

          <div className={styles.leadFaqWrapper}>
            <div className={styles.formColumn}>
              <h3>Únete a la lista prioritaria</h3>
              <p className="muted">Déjanos tus datos y te contactamos para activar tu plan.</p>
              <form className={styles.leadForm} onSubmit={handleLeadSubmit}>
                <div className={styles.leadField}>
                  <label htmlFor="club-name">Nombre</label>
                  <input
                    id="club-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                  />
                </div>
                <div className={styles.leadField}>
                  <label htmlFor="club-email">Email</label>
                  <input
                    id="club-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={leadEmail}
                    onChange={(event) => setLeadEmail(event.target.value)}
                  />
                </div>
                <div className={styles.leadField}>
                  <label htmlFor="club-plan">Plan de interés</label>
                  <select id="club-plan" value={leadPlan} onChange={(event) => setLeadPlan(event.target.value as 'basic' | 'medio' | 'premium')}>
                    <option value="basic">Básico</option>
                    <option value="medio">Medio</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <button className="btn" type="submit" disabled={isLeadSubmitting}>
                  {isLeadSubmitting ? 'Enviando...' : 'Quiero unirme'}
                </button>
                {leadStatus ? (
                  <p
                    className={`${styles.leadStatus} ${leadStatusType === 'error' ? styles.leadStatusError : styles.leadStatusSuccess}`}
                    role={leadStatusType === 'error' ? 'alert' : 'status'}
                    aria-live={leadStatusType === 'error' ? 'assertive' : 'polite'}
                  >
                    {leadStatus}
                  </p>
                ) : null}
              </form>
            </div>

            <div className={styles.faqColumn}>
              <h3>Preguntas frecuentes</h3>
              <p className="muted">Resolvemos las dudas más comunes antes de suscribirte.</p>
              <div className={styles.faqGrid}>
                {faqs.map((item) => (
                  <article key={item.question} className={styles.faqCard}>
                    <h4>{item.question}</h4>
                    <p className="muted">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
