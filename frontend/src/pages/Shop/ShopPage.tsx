import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import ProductCard from '@/components/ui/ProductCard'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ProductGridSkeleton } from '@/components/ui/Skeletons'
import { useProductsQuery } from '@/features/products/queries'
import type { ProductSortOption } from '@/types/product'
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
    key: 'lightLevel',
    title: 'Necesidad de luz',
    options: ['low', 'medium', 'high'],
  },
  {
    key: 'size',
    title: 'Tamaño',
    options: ['xs', 's', 'm', 'l', 'xl'],
  },
  {
    key: 'petFriendly',
    title: 'Pet-friendly',
    options: ['true', 'false'],
  },
] as const

type FilterKey = (typeof filters)[number]['key']
type FiltersState = Record<FilterKey, string[]>

const SORT_OPTIONS: Array<{ value: ProductSortOption; label: string }> = [
  { value: 'featured', label: 'Destacadas' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value)

const isSortOption = (value: string): value is ProductSortOption =>
  (SORT_VALUES as string[]).includes(value)

const toId = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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

const getFiltersStateFromSearch = (searchParams: URLSearchParams): FiltersState => {
  const parsed: FiltersState = {
    category: [],
    careLevel: [],
    lightLevel: [],
    size: [],
    petFriendly: [],
  }

  for (const group of filters) {
    const allowed = new Set<string>(group.options)
    parsed[group.key] = searchParams.getAll(group.key).filter((value) => allowed.has(value))
  }

  return parsed
}

const toPetFriendlyFilter = (selected: string[]) => {
  if (selected.length !== 1) {
    return undefined
  }

  return selected[0] === 'true'
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeFilters = useMemo(() => getFiltersStateFromSearch(searchParams), [searchParams])
  const sortParam = searchParams.get('sort') ?? 'featured'
  const sortBy: ProductSortOption = isSortOption(sortParam) ? sortParam : 'featured'
  const searchParam = searchParams.get('q') ?? ''

  const [searchInput, setSearchInput] = useState(searchParam)
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const filtersRef = useRef<HTMLElement | null>(null)
  const filtersToggleRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setSearchInput(searchParam)
    setDebouncedSearch(searchParam)
  }, [searchParam])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (current === debouncedSearch) {
      return
    }

    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      next.set('q', debouncedSearch)
    } else {
      next.delete('q')
    }

    setSearchParams(next, { replace: true })
  }, [debouncedSearch, searchParams, setSearchParams])

  const closeFilters = useCallback(() => setIsFiltersOpen(false), [])

  useFocusTrap({
    isOpen: isFiltersOpen,
    containerRef: filtersRef,
    triggerRef: filtersToggleRef,
    onClose: closeFilters,
  })

  const queryFilters = useMemo(
    () => ({
      category: activeFilters.category,
      careLevel: activeFilters.careLevel,
      lightLevel: activeFilters.lightLevel,
      size: activeFilters.size,
      petFriendly: toPetFriendlyFilter(activeFilters.petFriendly),
      q: debouncedSearch || undefined,
      sort: sortBy,
      limit: 12,
    }),
    [activeFilters, debouncedSearch, sortBy],
  )

  const [page, setPage] = useState(1)

  const filtersKey = JSON.stringify(queryFilters)
  useEffect(() => {
    setPage(1)
  }, [filtersKey])

  const {
    data,
    isPending,
    isFetching,
    error: queryError,
  } = useProductsQuery({ ...queryFilters, page })

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const loading = isPending
  const loadingMore = isFetching && !isPending
  const error = queryError ? queryError.message : null
  const hasMore = data ? data.page < data.totalPages : false
  const loadMore = () => setPage((prev) => prev + 1)

  const updateSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams)
      mutate(next)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const toggleFilter = (key: FilterKey, option: string) => {
    updateSearchParams((params) => {
      const current = params.getAll(key)
      const nextValues = current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option]

      params.delete(key)
      for (const value of nextValues) {
        params.append(key, value)
      }
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    updateSearchParams((params) => {
      for (const group of filters) {
        params.delete(group.key)
      }
      params.delete('q')
      params.delete('sort')
    })
  }

  const handleSortChange = (value: string) => {
    updateSearchParams((params) => {
      if (value === 'featured') {
        params.delete('sort')
      } else {
        params.set('sort', value)
      }
    })
  }

  const hasActiveFilters =
    Object.values(activeFilters).some((group) => group.length > 0) ||
    Boolean(searchParam) ||
    sortBy !== 'featured'

  return (
    <div className="page brand-page">
      <Header />
      <main id="main-content" className={styles.shop}>
        <div className={`container ${styles.layout}`}>
          <div
            className={styles.filtersOverlay}
            data-open={isFiltersOpen}
            aria-hidden="true"
            onClick={closeFilters}
          />
          <aside
            ref={filtersRef}
            className={`${styles.filters} ${isFiltersOpen ? styles.filtersOpen : ''}`}
            role="dialog"
            aria-modal={isFiltersOpen}
            aria-labelledby="shop-filters-title"
          >
            <div className={styles.filtersHeader}>
              <div>
                <h2 id="shop-filters-title">Tienda</h2>
                <p className="muted">Filtra para encontrar tu planta ideal.</p>
              </div>
              <button type="button" className={styles.filtersClose} onClick={closeFilters}>
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
                    <label
                      key={option}
                      className={styles.filterOption}
                      htmlFor={`${toId(group.title)}-${toId(option)}`}
                    >
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
                  {loading ? 'Buscando…' : `${total} ${total === 1 ? 'producto' : 'productos'}`}
                </p>
              </div>
              <div className={styles.mobileControls}>
                <label className={styles.searchField}>
                  <span className="sr-only">Buscar plantas</span>
                  <input
                    type="search"
                    value={searchInput}
                    placeholder="Buscar plantas..."
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  ref={filtersToggleRef}
                  className={`btn btn-outline ${styles.filtersToggle}`}
                  aria-expanded={isFiltersOpen}
                  aria-controls="shop-filters-title"
                  onClick={() => setIsFiltersOpen(true)}
                >
                  Filtros
                </button>
                <select
                  className={styles.sort}
                  aria-label="Ordenar"
                  value={sortBy}
                  onChange={(event) => handleSortChange(event.target.value)}
                  disabled={loading}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <div className="state-empty" role="alert" aria-live="assertive">
                <h3>No pudimos cargar la tienda</h3>
                <p className="muted">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="state-empty" role="status" aria-live="polite">
                <h3>No encontramos plantas con ese criterio</h3>
                <p className="muted">Ajusta los filtros para descubrir más opciones.</p>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
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
                {hasMore ? (
                  <div className={styles.loadMoreRow}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Cargando...' : 'Cargar más plantas'}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
