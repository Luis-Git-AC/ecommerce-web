import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import ProductCard from '../../components/ui/ProductCard'
import type { Product } from '../../types/product'
import { useProducts } from '../../features/products/useProducts'
import styles from './ShopPage.module.css'

const filters = [
  {
    key: 'category',
    title: 'Tipo',
    options: ['suculentas', 'interior', 'florales', 'colgantes'],
  },
  {
    key: 'careLevel',
    title: 'Nivel de cuidado',
    options: ['easy', 'medium', 'hard'],
  },
  {
    key: 'lightRequired',
    title: 'Necesidad de luz',
    options: ['low', 'medium', 'high'],
  },
  {
    key: 'size',
    title: 'Tamaño',
    options: ['xs', 's', 'm', 'l', 'xl'],
  },
  {
    key: 'petSafe',
    title: 'Pet-friendly',
    options: ['true', 'false'],
  },
] as const

type FilterKey = (typeof filters)[number]['key']
type SortOption = 'featured' | 'price-asc' | 'price-desc'
type FiltersState = Record<FilterKey, string[]>

const toId = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const initialFiltersState: FiltersState = {
  category: [],
  careLevel: [],
  lightRequired: [],
  size: [],
  petSafe: [],
}

const getFiltersStateFromSearch = (searchParams: URLSearchParams): FiltersState => {
  const parsed: FiltersState = {
    category: [],
    careLevel: [],
    lightRequired: [],
    size: [],
    petSafe: [],
  }

  for (const group of filters) {
    const allowed = new Set<string>(group.options)
    parsed[group.key] = searchParams.getAll(group.key).filter((value) => allowed.has(value))
  }

  return parsed
}

const parsePrice = (price: string) => Number.parseFloat(price.replace(/[^\d.]/g, '')) || 0

const optionLabelMap: Record<string, string> = {
  suculentas: 'Suculentas',
  interior: 'Interior',
  florales: 'Florales',
  colgantes: 'Colgantes',
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
  low: 'Baja',
  high: 'Alta',
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  true: 'Sí',
  false: 'No',
}

const getProductValue = (product: Product, key: FilterKey) => {
  if (key === 'petSafe') {
    return product.petSafe ? 'true' : 'false'
  }

  return String(product[key])
}

export default function ShopPage() {
  const [searchParams] = useSearchParams()
  const { products, loading, error } = useProducts()
  const [activeFilters, setActiveFilters] = useState<FiltersState>(initialFiltersState)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    setActiveFilters(getFiltersStateFromSearch(searchParams))
  }, [searchParams])

  useEffect(() => {
    if (!isFiltersOpen) {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isFiltersOpen])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) =>
      filters.every((group) => {
        const selected = activeFilters[group.key]
        if (!selected.length) {
          return true
        }

        const productValue = normalize(getProductValue(product, group.key))
        return selected.some((value) => normalize(value) === productValue)
      }),
    )

    if (sortBy === 'price-asc') {
      return [...filtered].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
    }

    if (sortBy === 'price-desc') {
      return [...filtered].sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
    }

    return filtered
  }, [activeFilters, products, sortBy])

  const hasActiveFilters = Object.values(activeFilters).some((group) => group.length > 0)

  const toggleFilter = (key: FilterKey, option: string) => {
    setActiveFilters((prev) => {
      const current = prev[key]
      const exists = current.includes(option)
      return {
        ...prev,
        [key]: exists ? current.filter((value) => value !== option) : [...current, option],
      }
    })
  }

  const clearFilters = () => {
    setActiveFilters(initialFiltersState)
    setSortBy('featured')
  }

  return (
    <div className="page brand-page">
      <Header />
      <main className={styles.shop}>
        <div className={`container ${styles.layout}`}>
          <button
            type="button"
            className={styles.filtersOverlay}
            aria-label="Cerrar filtros"
            aria-hidden={!isFiltersOpen}
            onClick={() => setIsFiltersOpen(false)}
          />
          <aside className={`${styles.filters} ${isFiltersOpen ? styles.filtersOpen : ''}`}>
            <div className={styles.filtersHeader}>
              <div>
              <h2>Tienda</h2>
              <p className="muted">Filtra para encontrar tu planta ideal.</p>
              </div>
              <button
                type="button"
                className={styles.filtersClose}
                onClick={() => setIsFiltersOpen(false)}
              >
                Cerrar
              </button>
              {hasActiveFilters ? (
                <button type="button" className={styles.resetButton} onClick={clearFilters}>
                  Limpiar filtros
                </button>
              ) : null}
            </div>
            {filters.map((group) => (
              <fieldset key={group.title} className={styles.filterGroup}>
                <legend>{group.title}</legend>
                <div className={styles.filterOptions}>
                  {group.options.map((option) => (
                    <label key={option} className={styles.filterOption} htmlFor={`${toId(group.title)}-${toId(option)}`}>
                      <input
                        id={`${toId(group.title)}-${toId(option)}`}
                        type="checkbox"
                        checked={activeFilters[group.key].includes(option)}
                        onChange={() => toggleFilter(group.key, option)}
                      />
                      <span>{optionLabelMap[option] ?? option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </aside>
          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <div>
                <h2>Plantas disponibles</h2>
                <p className="muted">Seleccionadas para distintos espacios y ritmos.</p>
                <p className={styles.resultsCount} aria-live="polite">
                  {visibleProducts.length} productos
                </p>
              </div>
              <div className={styles.mobileControls}>
                <button
                  type="button"
                  className={`btn btn-outline ${styles.filtersToggle}`}
                  onClick={() => setIsFiltersOpen(true)}
                >
                  Filtros
                </button>
                <select
                  className={styles.sort}
                  aria-label="Ordenar"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  disabled={loading}
                >
                  <option value="featured">Destacadas</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="state-empty" role="status" aria-live="polite">
                <h3>Cargando catálogo...</h3>
                <p className="muted">Estamos trayendo los productos desde el servidor.</p>
              </div>
            ) : error ? (
              <div className="state-empty" role="alert" aria-live="assertive">
                <h3>No pudimos cargar la tienda</h3>
                <p className="muted">{error}</p>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="state-empty" role="status" aria-live="polite">
                <h3>No encontramos plantas con ese criterio</h3>
                <p className="muted">Ajusta los filtros para descubrir más opciones.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.images.card}
                    mobileLayout="editorial"
                    variant="home"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
