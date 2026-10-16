import type { RequestFn } from '../stock-movements/types'
import type { Page, Product, Supplier } from '../master-data/api'

export type Movement = {
  id: string; requestId: string; productId: string; productSku: string; productName: string; productUnit: string; movementType: 'StockIn' | 'StockOut'; quantity: number; stockBefore: number; stockAfter: number; supplierId: string | null; supplierName: string | null; reason: string | null; referenceNumber: string | null; notes: string | null; performedByUserId: string; performedByDisplayName: string; occurredAtUtc: string; purchaseOrderId: string | null; purchaseOrderNumber: string | null; purchaseReceiptId: string | null; salesOrderId: string | null; salesOrderNumber: string | null; salesFulfillmentId: string | null; returnKind: 'CustomerReturn' | 'SupplierReturn' | null; customerReturnId: string | null; customerReturnNumber: string | null; supplierReturnId: string | null; supplierReturnNumber: string | null
}
export type Actor = { id: string; displayName: string }
export type MovementQuery = { productId: string; movementType: string; performedByUserId: string; fromUtc: string; toUtc: string; search: string; page: number; pageSize: number }
export type ActorQuery = { search: string; page: number; pageSize: number }

function queryString(values: Record<string, string | number | undefined>) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) }); return params.toString() }
export function getMovements(request: RequestFn, query: MovementQuery) { return request<Page<Movement>>(`/api/stock-movements?${queryString(query)}`) }
export function getMovement(request: RequestFn, id: string) { return request<Movement>(`/api/stock-movements/${id}`) }
export function getActors(request: RequestFn, query: ActorQuery) { return request<Page<Actor>>(`/api/stock-movements/actors?${queryString(query)}`) }
export type { Product, Supplier }
