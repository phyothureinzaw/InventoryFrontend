import { apiRequest } from '../../api/client'

export type User = {
  id: string
  displayName: string
  email: string
  role: 'Admin' | 'Staff'
}

export type LoginResponse = {
  accessToken: string
  expiresAtUtc: string
  user: User
}

export type LoginRequest = {
  email: string
  password: string
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  return apiRequest<User>('/api/auth/me', { accessToken })
}
