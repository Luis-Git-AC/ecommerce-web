import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './ClubPage.module.css'

const plans = [
  {
    id: 'basic',
    name: 'Basico',
    price: '$19/mes',
    description: 'Una planta seleccionada para tu espacio.',
    features: ['1 planta al mes', 'Guia de cuidado', 'Ajustes de preferencias'],
  },
  {
    id: 'medio',
    name: 'Medio',
    price: '$39/mes',
    description: 'Mas variedad y accesorios esenciales.',
    features: ['2 plantas al mes', 'Kit de cuidado', 'Soporte prioritario'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$59/mes',
    description: 'Experiencia completa y personalizacion total.',
    features: ['3 plantas al mes', 'Accesorios premium', 'Personalizacion avanzada'],
  },
]

const steps = [
  {
    title: 'Cuestionario rapido',
    description: 'Nos cuentas tu luz, tiempo y experiencia.',
  },
  {
    title: 'Seleccion personalizada',
    description: 'Elegimos plantas compatibles con tu entorno.',
  },
  {
    title: 'Caja mensual',
    description: 'Recibes tu planta lista para tu hogar.',
  },
]

const faqs = [
  {
    question: 'Puedo pausar o cancelar cuando quiera?',
    answer: 'Si. Puedes gestionar la suscripcion desde tu perfil en cualquier momento.',
  },
  {
    question: 'Que pasa si una planta no encaja?',
    answer: 'Puedes ajustar preferencias y solicitar un cambio en la siguiente caja.',
  },
  {
    question: 'Recibire una planta repetida?',
    answer: 'No. Priorizamos variedad y evitamos duplicados en tus envios.',
  },
]

export default function ClubPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.club}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroContent}`}>
            <p className={styles.eyebrow}>Club VerdeVivo</p>
            <h1>Tu coleccion crece con recomendaciones mensuales</h1>
            <p className="muted">
              Recibe plantas seleccionadas para tu espacio y aprende a cuidarlas sin perder tiempo en
              cada eleccion.
            </p>
            <div className={styles.heroActions}>
              <button className="btn">Elegir plan</button>
              <button className="btn btn-ghost">Ver como funciona</button>
            </div>
            <p className={styles.trust}>Sin permanencia · Cancela cuando quieras · Garantia de devolucion</p>
          </div>
        </section>

        <section className={`container ${styles.steps}`}>
          <div className={styles.sectionHeader}>
            <h2>Como funciona</h2>
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

        <section className={`container ${styles.plans}`}>
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
                <button className="btn">Empezar</button>
              </article>
            ))}
          </div>
        </section>

        <section className={`container ${styles.preview}`}>
          <div>
            <h2>Vista previa de la caja</h2>
            <p className="muted">Incluye planta, guia de cuidado y detalles que facilitan el mantenimiento.</p>
          </div>
          <div className={styles.previewCard}>
            <div>
              <h3>Contenido del mes</h3>
              <p className="muted">Planta principal + accesorio sorpresa + guia practica.</p>
            </div>
            <button className="btn btn-outline">Ver ejemplo</button>
          </div>
        </section>

        <section className={`container ${styles.faq}`}>
          <div className={styles.sectionHeader}>
            <h2>Preguntas frecuentes</h2>
            <p className="muted">Resolvemos las dudas mas comunes antes de suscribirte.</p>
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
      </main>
      <Footer />
    </div>
  )
}
