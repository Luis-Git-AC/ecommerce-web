import ProductCard from '../ui/ProductCard'
import { useFeaturedProducts } from '../../features/products/useProducts'

export default function ProductGridSection() {
  const products = useFeaturedProducts(4)

  return (
    <section id="productos" className="section">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Plantas destacadas</h2>
          <p className="muted">Selección para empezar o ampliar tu colección.</p>
        </div>
        <div className="grid">
          {products.map((product) => (
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
