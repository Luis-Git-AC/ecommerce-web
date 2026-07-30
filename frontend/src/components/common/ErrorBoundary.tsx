import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, errorInfo.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className={styles.wrapper} role="alert">
        <div className={styles.panel}>
          <p className={styles.code}>Error inesperado</p>
          <h1>Algo no ha ido bien</h1>
          <p className="muted">
            Se ha producido un error al mostrar esta página. Puedes recargar para volver a
            intentarlo.
          </p>

          {import.meta.env.DEV && this.state.error ? (
            <pre className={styles.details}>{this.state.error.message}</pre>
          ) : null}

          <div className={styles.actions}>
            <button type="button" className="btn" onClick={this.handleReload}>
              Recargar la página
            </button>
            <a className="btn btn-outline" href="/">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }
}
