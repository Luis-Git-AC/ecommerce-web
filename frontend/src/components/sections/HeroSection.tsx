import { Link } from 'react-router-dom'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={`container ${styles.heroContent}`}>
        <p className={styles.eyebrow}>Plantas de interior</p>
        <h1 className={styles.title}>Plantas seleccionadas según tu estilo de vida</h1>
        <p className={styles.lead}>
          Recomendaciones basadas en luz, tiempo y experiencia para que tu planta
          prospere sin complicaciones.
        </p>
        <p className={styles.trust}>Sin permanencia · Cancela cuando quieras · Garantía de devolución</p>
        <div className={styles.heroActions}>
          <Link className="btn" to="/#quiz">Encontrar mi planta ideal</Link>
          <Link className="btn btn-ghost" to="/shop">Ver catálogo completo</Link>
        </div>
      </div>
      <div className={styles.heroOverlay} />
    </section>
  )
}
