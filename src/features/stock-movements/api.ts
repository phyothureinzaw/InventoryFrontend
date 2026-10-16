import { ApiError } from '../../api/client'
import type { RequestFn, StockMovementResponse } from './types'

export type StockInRequest = {
  productId: string
  quantity: number
  supplierId: string | null
  referenceNumber: string
  notes: string
  requestId: string
}

export type StockOutRequest = {
  productId: string
  quantity: number
  reason: string
  referenceNumber: string
  notes: string
  requestId: string
}

export function stockIn(request: RequestFn, body: StockInRequest) {
  return request<StockMovementResponse>('/api/stock-movements/stock-in', { method: 'POST', body: JSON.stringify(body) })
}

export function stockOut(request: RequestFn, body: StockOutRequest) {
  return request<StockMovementResponse>('/api/stock-movements/stock-out', { method: 'POST', body: JSON.stringify(body) })
}

export function stockError(error: unknown, fallback: string) {
  const apiError = error as ApiError
  return apiError?.problem?.detail ?? apiError?.problem?.title ?? fallback
}

export function isUncertainStockError(error: unknown) {
  return !(error instanceof ApiError && error.status >= 400 && error.status < 500)
}
