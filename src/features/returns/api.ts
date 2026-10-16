import type { RequestFn } from '../stock-movements/types'
import type { Page } from '../master-data/api'

export type ReturnKind = 'customer' | 'supplier'
export type CustomerReturnQuery = { search: string; customerSearch: string; salesOrderId: string; salesFulfillmentId: string; customerId: string; fromUtc: string; toUtc: string; page: number; pageSize: number }
export type SupplierReturnQuery = { search: string; supplierSearch: string; purchaseOrderId: string; purchaseReceiptId: string; supplierId: string; fromUtc: string; toUtc: string; page: number; pageSize: number }
export type ReturnLine = { id: string; productId: string; productSku: string; productName: string; productUnit: string; quantity: number; stockMovementId: string; stockBefore: number; stockAfter: number; currentStock: number; reservedStock: number; availableStock: number }
export type CustomerReturn = { id: string; returnNumber: string; requestId: string; salesOrderId: string; salesOrderNumber: string; salesOrderStatus: string; salesFulfillmentId: string; customerId: string; customerName: string; customerIsActive: boolean; returnedByUserId: string; returnedByDisplayName: string; returnedAtUtc: string; reason: string; referenceNumber: string | null; notes: string | null; lines: ReturnLine[] }
export type SupplierReturn = { id: string; returnNumber: string; requestId: string; purchaseOrderId: string; purchaseOrderNumber: string; purchaseOrderStatus: string; purchaseReceiptId: string; supplierId: string; supplierName: string; supplierIsActive: boolean; returnedByUserId: string; returnedByDisplayName: string; returnedAtUtc: string; reason: string; referenceNumber: string | null; notes: string | null; lines: ReturnLine[] }
export type CustomerReturnSummary = Omit<CustomerReturn, 'lines'> & { lineCount: number; totalQuantity: number }
export type SupplierReturnSummary = Omit<SupplierReturn, 'lines'> & { lineCount: number; totalQuantity: number }
export type SourceLine = { id: string; productId: string; productSku: string; productName: string; productUnit: string; quantity: number; returnedQuantity: number; returnableQuantity: number; currentStock: number; reservedStock: number; availableStock: number }
export type CustomerSource = { id: string; salesOrderId: string; salesOrderNumber: string; salesOrderStatus: string; customerId: string; customerName: string; customerIsActive: boolean; fulfilledByUserId: string; fulfilledByDisplayName: string; fulfilledAtUtc: string; referenceNumber: string | null; lines: SourceLine[] }
export type SupplierSource = { id: string; purchaseOrderId: string; purchaseOrderNumber: string; purchaseOrderStatus: string; supplierId: string; supplierName: string; supplierIsActive: boolean; receivedByUserId: string; receivedByDisplayName: string; receivedAtUtc: string; referenceNumber: string | null; lines: SourceLine[] }
export type CustomerReturnWrite = { requestId: string; salesFulfillmentId: string; reason: string; referenceNumber: string | null; notes: string | null; lines: { salesFulfillmentLineId: string; quantity: number }[] }
export type SupplierReturnWrite = { requestId: string; purchaseReceiptId: string; reason: string; referenceNumber: string | null; notes: string | null; lines: { purchaseReceiptLineId: string; quantity: number }[] }

function queryString(values: Record<string, string | number | undefined>) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) }); return params.toString() }
export function getCustomerReturns(request: RequestFn, query: CustomerReturnQuery) { return request<Page<CustomerReturnSummary>>(`/api/customer-returns?${queryString(query)}`) }
export function getSupplierReturns(request: RequestFn, query: SupplierReturnQuery) { return request<Page<SupplierReturnSummary>>(`/api/supplier-returns?${queryString(query)}`) }
export function getCustomerReturn(request: RequestFn, id: string) { return request<CustomerReturn>(`/api/customer-returns/${id}`) }
export function getSupplierReturn(request: RequestFn, id: string) { return request<SupplierReturn>(`/api/supplier-returns/${id}`) }
export function getCustomerSources(request: RequestFn, query: Record<string, string | number | undefined>) { return request<Page<CustomerSource>>(`/api/customer-returns/sources?${queryString(query)}`) }
export function getSupplierSources(request: RequestFn, query: Record<string, string | number | undefined>) { return request<Page<SupplierSource>>(`/api/supplier-returns/sources?${queryString(query)}`) }
export function createCustomerReturn(request: RequestFn, body: CustomerReturnWrite) { return request<CustomerReturn>('/api/customer-returns', { method: 'POST', body: JSON.stringify(body) }) }
export function createSupplierReturn(request: RequestFn, body: SupplierReturnWrite) { return request<SupplierReturn>('/api/supplier-returns', { method: 'POST', body: JSON.stringify(body) }) }
