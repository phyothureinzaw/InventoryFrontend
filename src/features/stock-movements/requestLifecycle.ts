export type RequestSnapshot<T> = Readonly<{ requestId: string; payload: Readonly<T> }>

export function createRequestSnapshot<T extends object>(payload: T, requestId = crypto.randomUUID()): RequestSnapshot<T> {
  return Object.freeze({ requestId, payload: Object.freeze({ ...payload }) })
}

export function nextRequestId() {
  return crypto.randomUUID()
}

export function shouldAutoRetry() {
  return false
}

export function isUncertainOutcome(error: unknown): boolean {
  const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: unknown }).status : undefined
  return typeof status !== 'number' || status < 400 || status >= 500
}
