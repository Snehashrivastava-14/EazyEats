import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  if (roles && roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}
