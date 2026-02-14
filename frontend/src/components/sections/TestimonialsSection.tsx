import styles from './TestimonialsSection.module.css'

const testimonials = [
  {
    quote:
      'Siempre elegia plantas por foto y se me morian. Hice el quiz, me recomendo una que encaja con mi luz y llevo tres meses sin problemas. No es magia, pero por fin se que elegir.',
    name: 'Laura',
    location: 'Valencia',
    initial: 'L',
  },
  {
    quote:
      'Mi piso tiene poca luz y pensaba que no podia tener plantas. Respondi las preguntas y me recomendo una opcion adaptada a mi espacio. Esta creciendo bien y casi no me quita tiempo.',
    name: 'Andres',
    location: 'Bilbao',
    initial: 'A',
  },
  {
    quote:
      'Ya tenia experiencia, asi que fui directo al catalogo. Me gusto la variedad y la calidad; las fichas de cuidado son claras y eso ayuda a decidir rapido.',
    name: 'Sofia',
    location: 'Madrid',
    initial: 'S',
  },
  {
    quote:
      'Probe la suscripcion un par de meses porque no sabia que comprar. Las recomendaciones encajaron con mi espacio y pude cancelar sin lios cuando ya tenia mi planta ideal.',
    name: 'Clara',
    location: 'Sevilla',
    initial: 'C',
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonios" className="section">
      <div className={`container ${styles.wrapper}`}>
        <div className={styles.header}>
          <h2>Testimonios reales</h2>
          <p className="muted">Experiencias honestas de personas que ya eligieron su planta ideal.</p>
        </div>
        <div className={styles.grid}>
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className={styles.card}>
              <p className={styles.quote}>"{testimonial.quote}"</p>
              <div className={styles.person}>
                <div className={styles.avatar}>{testimonial.initial}</div>
                <div>
                  <p className={styles.name}>{testimonial.name}</p>
                  <p className="muted">{testimonial.location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
