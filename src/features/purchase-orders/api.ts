import type { RequestFn } from '../stock-movements/types'
import type { Page, Product, Supplier } from '../master-data/api'

export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'PartiallyReceived' | 'Received' | 'Cancelled'
export type PurchaseOrderQuery = { search: string; supplierId: string; status: string; fromUtc: string; toUtc: string; page: number; pageSize: number }
export type PurchaseOrderLine = { id: string; productId: string; productSku: string; productName: string; productUnit: string; orderedQuantity: number; receivedQuantity: number; remainingQuantity: number; rowVersion: string; createdAtUtc: string; updatedAtUtc: string }
export type PurchaseOrderSummary = { id: string; orderNumber: string; supplierId: string; supplierName: string; status: PurchaseOrderStatus; createdByUserId: string; createdByDisplayName: string; createdAtUtc: string; updatedAtUtc: string; lineCount: number; orderedQuantity: number; receivedQuantity: number; rowVersion: string }
export type Audit = { createdByUserId: string; createdByDisplayName: string; createdAtUtc: string; submittedByUserId: string | null; submittedByDisplayName: string | null; submittedAtUtc: string | null; approvedByUserId: string | null; approvedByDisplayName: string | null; approvedAtUtc: string | null; cancelledByUserId: string | null; cancelledByDisplayName: string | null; cancelledAtUtc: string | null; cancellationReason: string | null }
export type PurchaseOrderDetail = { id: string; orderNumber: string; supplierId: string; supplierName: string; supplierIsActive: boolean; status: PurchaseOrderStatus; rowVersion: string; updatedAtUtc: string; audit: Audit; lines: PurchaseOrderLine[] }
export type PurchaseReceiptSummary = { id: string; requestId: string; receivedByUserId: string; receivedByDisplayName: string; receivedAtUtc: string; referenceNumber: string | null; notes: string | null; lineCount: number; totalQuantity: number }
export type PurchaseReceiptLine = { id: string; purchaseOrderLineId: string; productId: string; productSku: string; productName: string; productUnit: string; quantity: number; stockMovementId: string; stockBefore: number; stockAfter: number; returnedQuantity: number; returnableQuantity: number }
export type PurchaseReceiptDetail = { id: string; purchaseOrderId: string; orderNumber: string; orderStatus: PurchaseOrderStatus; orderRowVersion: string; requestId: string; receivedByUserId: string; receivedByDisplayName: string; receivedAtUtc: string; referenceNumber: string | null; notes: string | null; lines: PurchaseReceiptLine[] }
export type PurchaseOrderWrite = { supplierId: string; lines: { productId: string; orderedQuantity: number }[] }
export type PurchaseReceiptWrite = { requestId: string; rowVersion: string; referenceNumber: string | null; notes: string | null; lines: { purchaseOrderLineId: string; quantity: number }[] }

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.toString()
}

export function getPurchaseOrders(request: RequestFn, query: PurchaseOrderQuery) { return request<Page<PurchaseOrderSummary>>(`/api/purchase-orders?${queryString(query)}`) }
export function getPurchaseOrder(request: RequestFn, id: string) { return request<PurchaseOrderDetail>(`/api/purchase-orders/${id}`) }
export function createPurchaseOrder(request: RequestFn, body: PurchaseOrderWrite) { return request<PurchaseOrderDetail>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(body) }) }
export function updatePurchaseOrder(request: RequestFn, id: string, body: PurchaseOrderWrite & { rowVersion: string }) { return request<PurchaseOrderDetail>(`/api/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function submitPurchaseOrder(request: RequestFn, id: string, rowVersion: string) { return request<void>(`/api/purchase-orders/${id}/submit`, { method: 'POST', body: JSON.stringify({ rowVersion }) }) }
export function approvePurchaseOrder(request: RequestFn, id: string, rowVersion: string) { return request<void>(`/api/purchase-orders/${id}/approve`, { method: 'POST', body: JSON.stringify({ rowVersion }) }) }
export function cancelPurchaseOrder(request: RequestFn, id: string, rowVersion: string, cancellationReason: string) { return request<void>(`/api/purchase-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ rowVersion, cancellationReason }) }) }
export function getPurchaseReceipts(request: RequestFn, orderId: string, page = 1) { return request<Page<PurchaseReceiptSummary>>(`/api/purchase-orders/${orderId}/receipts?page=${page}&pageSize=20`) }
export function getPurchaseReceipt(request: RequestFn, orderId: string, receiptId: string) { return request<PurchaseReceiptDetail>(`/api/purchase-orders/${orderId}/receipts/${receiptId}`) }
export function createPurchaseReceipt(request: RequestFn, orderId: string, body: PurchaseReceiptWrite) { return request<PurchaseReceiptDetail>(`/api/purchase-orders/${orderId}/receipts`, { method: 'POST', body: JSON.stringify(body) }) }
export type { Product, Supplier }
