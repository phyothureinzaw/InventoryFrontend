import type { PurchaseOrderStatus } from './api'

export type ReceiptValidationLine = { id: string; remainingQuantity: number }
export type PurchaseOrderActions = { edit: boolean; submit: boolean; approve: boolean; cancel: boolean; receive: boolean }

export function validateReceiptLines(lines: ReceiptValidationLine[], quantities: Record<string, string>) {
  const selected = lines.map(line => ({ purchaseOrderLineId: line.id, quantity: Number(quantities[line.id]) })).filter(line => Number.isInteger(line.quantity) && line.quantity > 0)
  const invalid = Object.entries(quantities).some(([id, value]) => value !== '' && (!Number.isInteger(Number(value)) || Number(value) <= 0 || Number(value) > (lines.find(line => line.id === id)?.remainingQuantity ?? 0)))
  return { selected, error: invalid ? 'Receipt quantities must be positive whole numbers and cannot exceed the displayed remainder.' : !selected.length ? 'Enter a positive quantity for at least one line.' : '' }
}

export function purchaseOrderActions(status: PurchaseOrderStatus, role: 'Admin' | 'Staff'): PurchaseOrderActions {
  return {
    edit: status === 'Draft',
    submit: status === 'Draft',
    approve: role === 'Admin' && status === 'Submitted',
    cancel: role === 'Admin' && ['Draft', 'Submitted', 'Approved', 'PartiallyReceived'].includes(status),
    receive: status === 'Approved' || status === 'PartiallyReceived',
  }
}
