import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { heroFrames } from '../../assets/hero/heroFrames.ts'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const [activeFrame, setActiveFrame] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const intervalId = window.setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % heroFrames.length)
    }, 6000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.heroBackgrounds} aria-hidden="true">
        {heroFrames.map((frame, index) => (
          <picture
            key={frame.desktopJpg}
            className={`${styles.heroImage} ${index === activeFrame ? styles.heroImageActive : ''}`}
          >
            <source media="(max-width: 768px)" srcSet={frame.mobileWebp} type="image/webp" />
            <source media="(max-width: 768px)" srcSet={frame.mobileJpg} type="image/jpeg" />
            <source srcSet={frame.desktopWebp} type="image/webp" />
            <img src={frame.desktopJpg} alt="" loading="eager" decoding="async" />
          </picture>
        ))}
      </div>
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
