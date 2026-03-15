import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import { contentRepository } from '../../services/content.repository'
import styles from './ClubPage.module.css'

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: '$19/mes',
    description: 'Una planta seleccionada para tu espacio.',
    features: ['1 planta al mes', 'Guía de cuidado', 'Ajustes de preferencias'],
  },
  {
    id: 'medio',
    name: 'Medio',
    price: '$39/mes',
    description: 'Más variedad y accesorios esenciales.',
    features: ['2 plantas al mes', 'Kit de cuidado', 'Soporte prioritario'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$59/mes',
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPlan, setLeadPlan] = useState<'basic' | 'medio' | 'premium'>('medio')
  const [leadStatus, setLeadStatus] = useState('')
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)

  useEffect(() => {
    if (!previewOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [previewOpen])

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = leadName.trim()
    const email = leadEmail.trim()
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!name || !isValidEmail) {
      setLeadStatus('Completa nombre y un correo válido para registrarte.')
      return
    }

    try {
      setIsLeadSubmitting(true)
      setLeadStatus('')

      await contentRepository.createClubLead({
        name,
        email,
        plan: leadPlan,
      })

      setLeadStatus('Listo. Te contactaremos con una propuesta de plan personalizada.')
      setLeadName('')
      setLeadEmail('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar tu interés.'
      setLeadStatus(message)
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  return (
    <div className="page">
      <Header />
      <main className={styles.club}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroContent}`}>
            <p className={styles.eyebrow}>Club VerdeVivo</p>
            <h1>Tu colección crece con recomendaciones mensuales</h1>
            <p className="muted">
              Recibe plantas seleccionadas para tu espacio y aprende a cuidarlas sin perder tiempo en
              cada elección.
            </p>
            <div className={styles.heroActions}>
              <a className="btn" href="#planes">Elegir plan</a>
              <a className="btn btn-ghost" href="#como-funciona">Ver cómo funciona</a>
            </div>
            <p className={styles.trust}>Sin permanencia · Cancela cuando quieras · Garantía de devolución</p>
          </div>
        </section>

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
            <div>
              <h3>Contenido del mes</h3>
              <p className="muted">Planta principal + accesorio sorpresa + guía práctica.</p>
            </div>
            <button className="btn btn-outline" type="button" onClick={() => setPreviewOpen(true)}>
              Ver ejemplo
            </button>
          </div>
        </section>

        <section className={`container ${styles.leadSection}`}>
          <div className={styles.sectionHeader}>
            <h2>Únete a la lista prioritaria</h2>
            <p className="muted">Déjanos tus datos y te contactamos para activar tu plan.</p>
          </div>
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
            {leadStatus ? <p className={styles.leadStatus}>{leadStatus}</p> : null}
          </form>
        </section>

        <section className={`container ${styles.faq}`}>
          <div className={styles.sectionHeader}>
            <h2>Preguntas frecuentes</h2>
            <p className="muted">Resolvemos las dudas más comunes antes de suscribirte.</p>
          </div>
          <div className={styles.faqGrid}>
            {faqs.map((item) => (
              <article key={item.question} className={styles.faqCard}>
                <h3>{item.question}</h3>
                <p className="muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {previewOpen ? (
          <div className={styles.previewModal} role="dialog" aria-modal="true" aria-labelledby="club-preview-title">
            <button
              type="button"
              className={styles.previewBackdrop}
              aria-label="Cerrar ejemplo"
              onClick={() => setPreviewOpen(false)}
            />
            <div className={styles.previewPanel}>
              <h3 id="club-preview-title">Ejemplo de caja del mes</h3>
              <p className="muted">Edición primavera con selección equilibrada para interior.</p>
              <ul className={styles.previewList}>
                <li>Poto en maceta de 14 cm</li>
                <li>Nutriente orgánico para 4 semanas</li>
                <li>Tarjeta de cuidados por niveles</li>
              </ul>
              <button className="btn" type="button" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
