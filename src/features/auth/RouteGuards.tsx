import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CircularProgress, Stack } from '@mui/material'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Stack>
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function RequireAdmin() {
  const { user } = useAuth()
  return user?.role === 'Admin' ? <Outlet /> : <Navigate to="/forbidden" replace />
}
