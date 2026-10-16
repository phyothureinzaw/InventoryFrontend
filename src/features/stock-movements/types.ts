export type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>

export type StockMovementResponse = {
  id: string
  productId: string
  movementType: 'StockIn' | 'StockOut'
  quantity: number
  stockBefore: number
  stockAfter: number
  supplierId: string | null
  reason: string | null
  referenceNumber: string | null
  notes: string | null
  performedByUserId: string
  occurredAtUtc: string
  requestId: string
}
