import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import ProductCard from '../../components/ui/ProductCard'
import { productsMock } from '../../mocks/products.mock'
import styles from './ProductPage.module.css'

const gallery = [
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=1000&q=80',
]

const careInfo = [
  { label: 'Luz', value: 'Media' },
  { label: 'Riego', value: '1 vez por semana' },
  { label: 'Dificultad', value: 'Facil' },
  { label: 'Pet-friendly', value: 'Si' },
]

const related = productsMock.slice(0, 3)

export default function ProductPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.product}>
        <div className={`container ${styles.layout}`}>
          <section className={styles.gallery}>
            <img src={gallery[0]} alt="Planta destacada" className={styles.mainImage} />
            <div className={styles.thumbs}>
              {gallery.map((image, index) => (
                <button key={image} type="button" className={styles.thumb} aria-label={`Imagen ${index + 1}`}>
                  <img src={image} alt="Vista" />
                </button>
              ))}
            </div>
          </section>
          <section className={styles.details}>
            <p className={styles.category}>Planta de interior</p>
            <h1>Monstera Deliciosa</h1>
            <p className={styles.price}>$42</p>
            <p className="muted">
              Hojas grandes, facil de cuidar y perfecta para espacios con luz media. Ideal para quienes quieren una
              planta protagonista sin demasiadas complicaciones.
            </p>
            <button className="btn">Anadir al carrito</button>
            <div className={styles.care}>
              <h2>Ficha de cuidado</h2>
              <div className={styles.careGrid}>
                {careInfo.map((item) => (
                  <div key={item.label} className={styles.careItem}>
                    <p className={styles.careLabel}>{item.label}</p>
                    <p className={styles.careValue}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <section className={`container ${styles.related}`}>
          <div className={styles.relatedHeader}>
            <h2>Quizas tambien te guste</h2>
            <p className="muted">Complementa tu espacio con opciones similares.</p>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <ProductCard key={item.id} name={item.name} price={item.price} image={item.image} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
