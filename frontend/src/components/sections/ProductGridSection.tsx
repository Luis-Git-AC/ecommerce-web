import ProductCard from '../ui/ProductCard'
import { productsMock } from '../../mocks/products.mock'

export default function ProductGridSection() {
  return (
    <section id="productos" className="section">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Plantas destacadas</h2>
          <p className="muted">Incluir imágenes reales (pendiente).</p>
        </div>
        <div className="grid">
          {productsMock.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.images.card}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
