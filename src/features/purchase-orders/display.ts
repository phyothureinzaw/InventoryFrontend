import type { PurchaseOrderStatus } from './api'

export function statusLabel(status: PurchaseOrderStatus) { return status === 'PartiallyReceived' ? 'Partially received' : status }
export function statusColor(status: PurchaseOrderStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' { if (status === 'Draft') return 'default'; if (status === 'Submitted') return 'primary'; if (status === 'Approved') return 'warning'; if (status === 'PartiallyReceived') return 'primary'; if (status === 'Received') return 'success'; return 'error' }
export function formatLocal(value: string | null) { return value ? new Date(value).toLocaleString() : '—' }
