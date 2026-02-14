import styles from './OurProcessSection.module.css'

const steps = [
  {
    title: 'Respondes 4 preguntas',
    description: 'Sobre tu luz, tiempo disponible, experiencia y estilo.',
  },
  {
    title: 'Filtramos por tu entorno',
    description: 'Plantas que realmente se adaptan a tu espacio.',
  },
  {
    title: 'Recibes recomendaciones claras',
    description: 'Personalizadas y con explicación del porqué.',
  },
  {
    title: 'Eliges con confianza',
    description: 'O exploras el catálogo completo.',
  },
]

export default function OurProcessSection() {
  return (
    <section id="proceso" className="section">
      <div className={`container ${styles.wrapper}`}>
        <div className={styles.header}>
          <h2>Nuestro proceso</h2>
          <p className="muted">
            Simplificamos la decisión para que elijas una planta que encaje con tu contexto.
          </p>
        </div>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <article key={step.title} className={styles.card}>
              <div className={styles.index}>{index + 1}</div>
              <h3>{step.title}</h3>
              <p className="muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
