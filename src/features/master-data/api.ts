import type { ApiError } from '../../api/client'

export type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>

export type Page<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number }
export type Category = { id: string; name: string; isActive: boolean; createdAtUtc: string; updatedAtUtc: string }
export type Supplier = { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; isActive: boolean; createdAtUtc: string; updatedAtUtc: string }
export type Product = { id: string; sku: string; name: string; categoryId: string; categoryName: string; unit: string; currentStock: number; reservedStock: number; availableStock: number; lowStockThreshold: number; isLowStock: boolean; isOutOfStock: boolean; isActive: boolean; rowVersion: string; createdAtUtc: string; updatedAtUtc: string }
export type Customer = { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; isActive: boolean; rowVersion: string; createdAtUtc: string; updatedAtUtc: string }

export type CategoryQuery = { search: string; isActive: string; page: number; pageSize: number }
export type SupplierQuery = { search: string; isActive: string; page: number; pageSize: number }
export type ProductQuery = { search: string; categoryId: string; isActive: string; stockStatus: string; page: number; pageSize: number }
export type CustomerQuery = { search: string; isActive: string; page: number; pageSize: number }
export type CustomerForm = { name: string; contactName: string; phone: string; email: string; address: string }

function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.toString()
}

export function getCategories(request: RequestFn, query: CategoryQuery) {
  return request<Page<Category>>(`/api/categories?${queryString(query)}`)
}
export function getCategory(request: RequestFn, id: string) { return request<Category>(`/api/categories/${id}`) }
export function createCategory(request: RequestFn, body: { name: string }) { return request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(body) }) }
export function updateCategory(request: RequestFn, id: string, body: { name: string }) { return request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function setCategoryStatus(request: RequestFn, id: string, isActive: boolean) { return request<void>(`/api/categories/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }) }

export function getSuppliers(request: RequestFn, query: SupplierQuery) { return request<Page<Supplier>>(`/api/suppliers?${queryString(query)}`) }
export function getSupplier(request: RequestFn, id: string) { return request<Supplier>(`/api/suppliers/${id}`) }
export function createSupplier(request: RequestFn, body: SupplierForm) { return request<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(body) }) }
export function updateSupplier(request: RequestFn, id: string, body: SupplierForm) { return request<Supplier>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function setSupplierStatus(request: RequestFn, id: string, isActive: boolean) { return request<void>(`/api/suppliers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }) }
export type SupplierForm = { name: string; contactName: string; phone: string; email: string; address: string }

export function getProducts(request: RequestFn, query: ProductQuery) { return request<Page<Product>>(`/api/products?${queryString(query)}`) }
export function getProduct(request: RequestFn, id: string) { return request<Product>(`/api/products/${id}`) }
export function createProduct(request: RequestFn, body: ProductForm) { return request<Product>('/api/products', { method: 'POST', body: JSON.stringify(body) }) }
export function updateProduct(request: RequestFn, id: string, body: ProductForm & { rowVersion: string }) { return request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function setProductStatus(request: RequestFn, id: string, isActive: boolean, rowVersion: string) { return request<void>(`/api/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive, rowVersion }) }) }
export type ProductForm = { sku: string; name: string; categoryId: string; unit: string; lowStockThreshold: number }

export function getCustomers(request: RequestFn, query: CustomerQuery) { return request<Page<Customer>>(`/api/customers?${queryString(query)}`) }
export function getCustomer(request: RequestFn, id: string) { return request<Customer>(`/api/customers/${id}`) }
export function createCustomer(request: RequestFn, body: CustomerForm) { return request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(body) }) }
export function updateCustomer(request: RequestFn, id: string, body: CustomerForm & { rowVersion: string }) { return request<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export function setCustomerStatus(request: RequestFn, id: string, isActive: boolean, rowVersion: string) { return request<void>(`/api/customers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive, rowVersion }) }) }

export function errorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError
  return apiError?.problem?.detail ?? apiError?.problem?.title ?? fallback
}
