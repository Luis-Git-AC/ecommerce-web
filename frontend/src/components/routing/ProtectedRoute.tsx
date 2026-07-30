import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/store/AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/account" replace state={{ from: location.pathname + location.search }} />
  }

  return <>{children}</>
}
