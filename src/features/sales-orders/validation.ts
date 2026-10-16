import type { SalesOrderLine, SalesOrderStatus } from './api'

export type SalesOrderActions = { edit: boolean; confirm: boolean; cancel: boolean; fulfill: boolean }
export function salesOrderActions(status: SalesOrderStatus, role: 'Admin' | 'Staff'): SalesOrderActions { return { edit: status === 'Draft', confirm: role === 'Admin' && status === 'Draft', cancel: role === 'Admin' && ['Draft', 'Confirmed', 'PartiallyFulfilled'].includes(status), fulfill: status === 'Confirmed' || status === 'PartiallyFulfilled' } }
export function validateFulfillmentLines(lines: SalesOrderLine[], quantities: Record<string, string>) {
  const selected = lines.map(line => ({ salesOrderLineId: line.id, quantity: Number(quantities[line.id]) })).filter(line => Number.isInteger(line.quantity) && line.quantity > 0)
  const invalid = Object.entries(quantities).some(([id, value]) => value !== '' && (!Number.isInteger(Number(value)) || Number(value) <= 0 || Number(value) > (lines.find(line => line.id === id)?.activeReservationQuantity ?? 0)))
  return { selected, error: invalid ? 'Fulfillment quantities must be positive whole numbers and cannot exceed the active reservation.' : !selected.length ? 'Enter a positive quantity for at least one reserved line.' : '' }
}
