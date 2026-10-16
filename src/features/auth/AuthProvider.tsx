/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError, apiRequest, type ProblemDetails } from '../../api/client'
import { getCurrentUser, login, type LoginRequest, type User } from './authApi'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
  request: <T>(path: string, options?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | null>(null)
  const isLoading = false
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setExpiresAtUtc(null)
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    if (!accessToken || !expiresAtUtc) return
    const timeout = window.setTimeout(() => {
      clearSession()
      navigate('/login', { replace: true, state: { from: location } })
    }, Math.max(0, Date.parse(expiresAtUtc) - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [accessToken, expiresAtUtc, clearSession, location, navigate])

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const signIn = async (request: LoginRequest) => {
    const response = await login(request)
    const authoritativeUser = await getCurrentUser(response.accessToken)
    setAccessToken(response.accessToken)
    setExpiresAtUtc(response.expiresAtUtc)
    setUser(authoritativeUser)
  }

  const request = async <T,>(path: string, options: RequestInit = {}) => {
    if (!accessToken) throw new ApiError(401, { title: 'Unauthorized' })
    try {
      return await apiRequest<T>(path, { ...options, accessToken })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession()
        navigate('/login', { replace: true, state: { from: location } })
      }
      throw error
    }
  }

  const value: AuthContextValue = { user, isLoading, login: signIn, logout, request }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function getProblemMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const problem: ProblemDetails = error.problem
    if (error.status === 401) return 'The email or password is invalid.'
    return problem.detail ?? problem.title ?? fallback
  }
  return fallback
}
