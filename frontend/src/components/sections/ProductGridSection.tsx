import styles from './ProductGridSection.module.css'

const products = [
  {
    id: 'p1',
    name: 'Monstera Deliciosa',
    price: '$42',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p2',
    name: 'Ficus Lyrata',
    price: '$58',
    image:
      'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p3',
    name: 'Pothos Dorado',
    price: '$24',
    image:
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'p4',
    name: 'Sansevieria',
    price: '$29',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
  },
]

export default function ProductGridSection() {
  return (
    <section id="productos" className="section">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Plantas destacadas</h2>
          <p className="muted">Selección curada con imágenes reales.</p>
        </div>
        <div className="grid">
          {products.map((product) => (
            <article key={product.id} className="card">
              <img className={styles.productImage} src={product.image} alt={product.name} />
              <div className={styles.cardBody}>
                <h3>{product.name}</h3>
                <p className="muted">{product.price}</p>
                <button className="btn btn-outline">Ver detalle</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
