import styles from './RouteFallback.module.css'

export default function RouteFallback() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className="sr-only">Cargando página…</span>
    </div>
  )
}
