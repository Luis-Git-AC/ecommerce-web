import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import ProductCard from '../../components/ui/ProductCard'
import { productsMock } from '../../mocks/products.mock'
import styles from './ShopPage.module.css'

const filters = [
  {
    title: 'Tipo',
    options: ['Suculenta', 'Tropical', 'Cactus', 'Trepadora'],
  },
  {
    title: 'Nivel de cuidado',
    options: ['Facil', 'Moderado', 'Experto'],
  },
  {
    title: 'Necesidad de luz',
    options: ['Baja', 'Media', 'Alta'],
  },
  {
    title: 'Tamano',
    options: ['Pequena', 'Mediana', 'Grande'],
  },
  {
    title: 'Pet-friendly',
    options: ['Si', 'No'],
  },
]

export default function ShopPage() {
  return (
    <div className="page">
      <Header />
      <main className={styles.shop}>
        <div className={`container ${styles.layout}`}>
          <aside className={styles.filters}>
            <div className={styles.filtersHeader}>
              <h2>Tienda</h2>
              <p className="muted">Filtra para encontrar tu planta ideal.</p>
            </div>
            {filters.map((group) => (
              <div key={group.title} className={styles.filterGroup}>
                <h3>{group.title}</h3>
                <div className={styles.filterOptions}>
                  {group.options.map((option) => (
                    <label key={option} className={styles.filterOption}>
                      <input type="checkbox" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </aside>
          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <div>
                <h2>Plantas disponibles</h2>
                <p className="muted">Seleccionadas para distintos espacios y ritmos.</p>
              </div>
              <select className={styles.sort} aria-label="Ordenar">
                <option>Destacadas</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
              </select>
            </div>
            <div className={styles.grid}>
              {productsMock.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.images.card}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
