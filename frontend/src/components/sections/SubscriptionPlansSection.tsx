import styles from './SubscriptionPlansSection.module.css'

const plans = [
  {
    id: 'basic',
    name: 'Básico',
    price: '$19/mes',
    description: 'Una planta fácil de cuidar cada mes.',
  },
  {
    id: 'verde',
    name: 'Verde',
    price: '$39/mes',
    description: 'Planta + accesorios esenciales.',
  },
  {
    id: 'jungla',
    name: 'Jungla',
    price: '$59/mes',
    description: 'Experiencia completa con sorpresas.',
  },
]

export default function SubscriptionPlansSection() {
  return (
    <section id="planes" className="section section-alt">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Planes de suscripción</h2>
          <p className="muted">Elige el nivel ideal para tu jungla personal.</p>
        </div>
        <div className={`grid ${styles.plansGrid}`}>
          {plans.map((plan) => (
            <article key={plan.id} className={`card ${styles.planCard}`}>
              <div>
                <h3>{plan.name}</h3>
                <p className={styles.price}>{plan.price}</p>
                <p className="muted">{plan.description}</p>
              </div>
              <button className="btn">Empezar</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
