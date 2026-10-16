import type { RequestFn } from '../stock-movements/types'
import type { Customer, Page, Product } from '../master-data/api'

export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'PartiallyFulfilled' | 'Fulfilled' | 'Cancelled'
export type SalesOrderQuery = { search: string; customerId: string; status: string; fromUtc: string; toUtc: string; page: number; pageSize: number }
export type SalesOrderLine = { id: string; productId: string; productSku: string; productName: string; productUnit: string; productIsActive: boolean; orderedQuantity: number; fulfilledQuantity: number; unfulfilledQuantity: number; activeReservationQuantity: number; currentStock: number; reservedStock: number; availableStock: number; rowVersion: string; createdAtUtc: string; updatedAtUtc: string }
export type SalesOrderSummary = { id: string; orderNumber: string; customerId: string; customerName: string; status: SalesOrderStatus; createdByUserId: string; createdByDisplayName: string; createdAtUtc: string; updatedAtUtc: string; lineCount: number; orderedQuantity: number; fulfilledQuantity: number; rowVersion: string }
export type SalesOrderAudit = { createdByUserId: string; createdByDisplayName: string; createdAtUtc: string; confirmedByUserId: string | null; confirmedByDisplayName: string | null; confirmedAtUtc: string | null; cancelledByUserId: string | null; cancelledByDisplayName: string | null; cancelledAtUtc: string | null; cancellationReason: string | null }
export type SalesOrderDetail = { id: string; orderNumber: string; customerId: string; customerName: string; customerIsActive: boolean; status: SalesOrderStatus; rowVersion: string; updatedAtUtc: string; audit: SalesOrderAudit; lines: SalesOrderLine[] }
export type SalesOrderWrite = { customerId: string; lines: { productId: string; orderedQuantity: number }[] }
export type FulfillmentLine = { id: string; salesOrderLineId: string; productId: string; productSku: string; productName: string; productUnit: string; quantity: number; stockMovementId: string; stockBefore: number; stockAfter: number; currentStock: number; reservedStock: number; availableStock: number; returnedQuantity: number; returnableQuantity: number }
export type FulfillmentSummary = { id: string; requestId: string; fulfilledByUserId: string; fulfilledByDisplayName: string; fulfilledAtUtc: string; referenceNumber: string | null; notes: string | null; lineCount: number; totalQuantity: number }
export type FulfillmentDetail = { id: string; salesOrderId: string; orderNumber: string; orderStatus: SalesOrderStatus; orderRowVersion: string; requestId: string; fulfilledByUserId: string; fulfilledByDisplayName: string; fulfilledAtUtc: string; referenceNumber: string | null; notes: string | null; lines: FulfillmentLine[] }
export type FulfillmentWrite = { requestId: string; rowVersion: string; referenceNumber: string | null; notes: string | null; lines: { salesOrderLineId: string; quantity: number }[] }
export type SalesOrderCancelWrite = { rowVersion: string; cancellationReason: string }

function queryString(values: Record<string, string | number | undefined>) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) }); return params.toString() }
export function getSalesOrders(request: RequestFn, query: SalesOrderQuery) { return request<Page<SalesOrderSummary>>(`/api/sales-orders?${queryString(query)}`) }
export function getSalesOrder(request: RequestFn, id: string) { return request<SalesOrderDetail>(`/api/sales-orders/${id}`) }
export function createSalesOrder(request: RequestFn, body: SalesOrderWrite) { return request<SalesOrderDetail>('/api/sales-orders', { method: 'POST', body: JSON.stringify(body) }) }
export function updateSalesOrder(request: RequestFn, id: string, body: SalesOrderWrite & { rowVersion: string }) { return request<SalesOrderDetail>(`/api/sales-orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function confirmSalesOrder(request: RequestFn, id: string, rowVersion: string) { return request<SalesOrderDetail>(`/api/sales-orders/${id}/confirm`, { method: 'POST', body: JSON.stringify({ rowVersion }) }) }
export function cancelSalesOrder(request: RequestFn, id: string, body: SalesOrderCancelWrite) { return request<SalesOrderDetail>(`/api/sales-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify(body) }) }
export function getFulfillments(request: RequestFn, orderId: string, page = 1) { return request<Page<FulfillmentSummary>>(`/api/sales-orders/${orderId}/fulfillments?page=${page}&pageSize=20`) }
export function getFulfillment(request: RequestFn, orderId: string, fulfillmentId: string) { return request<FulfillmentDetail>(`/api/sales-orders/${orderId}/fulfillments/${fulfillmentId}`) }
export function createFulfillment(request: RequestFn, orderId: string, body: FulfillmentWrite) { return request<FulfillmentDetail>(`/api/sales-orders/${orderId}/fulfillments`, { method: 'POST', body: JSON.stringify(body) }) }
export type { Customer, Product }
