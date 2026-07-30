import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from '@/App.tsx'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/store/AuthContext.tsx'
import { CartProvider } from '@/store/CartContext.tsx'
import { ThemeProvider } from '@/store/ThemeContext.tsx'

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
          {ReactQueryDevtools ? (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          ) : null}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
