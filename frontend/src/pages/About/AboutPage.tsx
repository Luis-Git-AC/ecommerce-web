import { Link } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import styles from './AboutPage.module.css'

const values = [
  {
    title: 'Seleccion consciente',
    description: 'Priorizamos plantas resistentes y adaptables para hogares reales.',
  },
  {
    title: 'Cuidado sencillo',
    description: 'Guias claras para que cuidar tu planta no sea una carga.',
  },
  {
    title: 'Compromiso sostenible',
    description: 'Reducimos desperdicio y usamos empaques responsables cuando es posible.',
  },
]

export default function AboutPage() {
  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.about}>
        <section className="container page-hero">
          <p className="page-eyebrow">Sobre nosotros</p>
          <h1>{'{ecommerce} nace para ayudarte a elegir con confianza'}</h1>
          <p className="muted">
            No vendemos plantas al azar. Creamos recomendaciones claras para que tu coleccion crezca con sentido y sin
            complicaciones.
          </p>
        </section>

        <section className={`container ${styles.story}`}>
          <div>
            <h2>Nuestra idea</h2>
            <p className="muted">
              Creemos que una planta bonita no basta. Lo importante es que encaje con tu espacio, tu luz y tu tiempo.
              Por eso combinamos seleccion curada con un sistema simple de recomendacion.
            </p>
          </div>
          <div className={styles.highlight}>
            <p>
              Mas claridad, menos error. Nuestro objetivo es que cada planta llegue a un hogar donde pueda prosperar.
            </p>
          </div>
        </section>

        <section className={`container ${styles.values}`}>
          <h2>Lo que defendemos</h2>
          <div className={styles.valueGrid}>
            {values.map((value) => (
              <article key={value.title} className={styles.valueCard}>
                <h3>{value.title}</h3>
                <p className="muted">{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`container ${styles.cta}`}>
          <div>
            <h2>Listo para elegir tu planta ideal?</h2>
            <p className="muted">Explora el catalogo o prueba el quiz para recibir una recomendacion.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link className="btn" to="/shop">Ver tienda</Link>
            <Link className="btn btn-ghost" to="/#quiz">Hacer el quiz</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
