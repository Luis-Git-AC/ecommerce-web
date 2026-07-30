import ProductCard from '../ui/ProductCard'
import { ProductGridSkeleton } from '../ui/Skeletons'
import { useFeaturedProductsQuery } from '@/features/products/queries'

export default function ProductGridSection() {
  const { data: products = [], isPending: loading, error } = useFeaturedProductsQuery(4)

  return (
    <section id="productos" className="section">
      <div className="container section-inner">
        <div className="section-header">
          <h2>Plantas destacadas</h2>
          <p className="muted">Selección para empezar o ampliar tu colección.</p>
        </div>
        {loading ? <ProductGridSkeleton count={4} /> : null}
        {error ? <p className="muted">No fue posible cargar destacados en este momento.</p> : null}
        {!loading && !error ? (
          <div className="grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                currency={product.currency}
                stock={product.stock}
                image={product.images.card}
                mobileLayout="editorial"
                variant="home"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
