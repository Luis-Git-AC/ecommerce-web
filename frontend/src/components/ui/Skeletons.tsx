import Skeleton from './Skeleton'
import styles from './Skeletons.module.css'

export function ProductCardSkeleton() {
  return (
    <article className={styles.card}>
      <Skeleton variant="image" height="220px" />
      <div className={styles.cardBody}>
        <Skeleton variant="title" width="75%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="block" height="44px" />
      </div>
    </article>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid} role="status" aria-live="polite">
      <span className="sr-only">Cargando catálogo de plantas…</span>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className={styles.detail} role="status" aria-live="polite">
      <span className="sr-only">Cargando el detalle del producto…</span>
      <Skeleton variant="image" height="440px" />
      <div className={styles.detailBody}>
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="title" width="70%" height="2.5rem" />
        <Skeleton variant="title" width="25%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="block" height="48px" width="220px" />
      </div>
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className={styles.cart} role="status" aria-live="polite">
      <span className="sr-only">Cargando tu carrito…</span>
      <div className={styles.cartItems}>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={styles.cartRow}>
            <Skeleton variant="image" width="88px" height="88px" />
            <div className={styles.cartMeta}>
              <Skeleton variant="title" width="60%" />
              <Skeleton variant="text" width="35%" />
            </div>
            <Skeleton variant="text" width="70px" />
          </div>
        ))}
      </div>
      <div className={styles.cartSummary}>
        <Skeleton variant="title" width="50%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="block" height="48px" />
      </div>
    </div>
  )
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.orderList} role="status" aria-live="polite">
      <span className="sr-only">Cargando tus pedidos…</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.orderCard}>
          <div className={styles.orderTop}>
            <Skeleton variant="block" width="110px" height="28px" />
            <Skeleton variant="text" width="100px" />
          </div>
          <Skeleton variant="title" width="140px" height="1.6rem" />
          <Skeleton variant="block" height="34px" />
          <div className={styles.orderFoot}>
            <Skeleton variant="text" width="70px" />
            <Skeleton variant="text" width="90px" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={styles.list} role="status" aria-live="polite">
      <span className="sr-only">Cargando datos administrativos…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={styles.listRow}>
          <div className={styles.listMeta}>
            <Skeleton variant="text" width="220px" />
            <Skeleton variant="text" width="160px" />
          </div>
          <Skeleton variant="text" width="90px" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className={styles.stats} role="status" aria-live="polite">
      <span className="sr-only">Cargando indicadores…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={styles.statCard}>
          <Skeleton variant="text" width="55%" />
          <Skeleton variant="title" width="70%" height="2rem" />
          <Skeleton variant="text" width="45%" />
        </div>
      ))}
    </div>
  )
}
