import boxMedioPreview from '../../assets/club/box-medio-preview.png'
import styles from './ClubHeroSection.module.css'

export default function ClubHeroSection() {
  return (
    <section id="club-hero" className={styles.clubHero}>
      <div className={styles.clubHeroBackgrounds} aria-hidden="true">
        <img src={boxMedioPreview} alt="" className={styles.clubHeroStaticImage} loading="eager" decoding="async" />
      </div>
      <div className={`container ${styles.clubHeroContent}`}>
        <p className={styles.eyebrow}>Club exclusivo</p>
        <h1 className={styles.title}>Tu planta perfecta, cada mes</h1>
        <p className={styles.lead}>
          Plantas seleccionadas según tu luz, espacio y experiencia. Sin compromiso,
          cancela cuando quieras.
        </p>
        <p className={styles.trust}>Desde 14 € · Sin permanencia · Cambios incluidos</p>
        <div className={styles.clubHeroActions}>
          <a href="#planes" className="btn">Elegir plan</a>
          <a href="#como-funciona" className={`btn btn-ghost ${styles.clubHeroGhostBtn}`}>Ver cómo funciona</a>
        </div>
      </div>
      <div className={styles.clubHeroOverlay} />
    </section>
  )
}
