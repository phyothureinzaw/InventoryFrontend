const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5243'

export type ProblemDetails = {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails

  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail ?? problem.title ?? `API returned ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

type ApiRequestOptions = RequestInit & { accessToken?: string }

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...requestInit } = options
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: {
      Accept: 'application/json',
      ...(requestInit.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    let problem: ProblemDetails = {}
    try {
      problem = await response.json() as ProblemDetails
    } catch {
      // Some authentication middleware responses have no body.
    }
    throw new ApiError(response.status, problem)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getHealth(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('/api/health')
}
