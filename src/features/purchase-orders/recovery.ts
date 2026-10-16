import type { ReceiptSnapshot } from './lifecycle'

const storagePrefix = 'inventory.pending-receipt.'
const schemaVersion = 1

export type PendingReceiptRecovery = Readonly<{
  version: 1
  userId: string
  orderId: string
  requestId: string
  payload: ReceiptSnapshot['payload']
}>

function storageKey(userId: string) { return `${storagePrefix}${userId}` }
function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }
function isNonEmpty(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }

function getStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage } catch { return null }
}

export function readPendingReceiptRecovery(userId: string, orderId?: string): PendingReceiptRecovery | null {
  if (!isUuid(userId)) return null
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isValidRecovery(parsed) || parsed.userId !== userId || (orderId && parsed.orderId !== orderId)) return null
    return parsed
  } catch { return null }
}

export function savePendingReceiptRecovery(value: { userId: string; orderId: string; snapshot: ReceiptSnapshot }): string | null {
  const storage = getStorage()
  if (!storage) return 'Session recovery is unavailable; a refresh may lose this unresolved receipt.'
  const recovery: PendingReceiptRecovery = { version: schemaVersion, userId: value.userId, orderId: value.orderId, requestId: value.snapshot.requestId, payload: value.snapshot.payload }
  try { storage.setItem(storageKey(value.userId), JSON.stringify(recovery)); return null } catch { return 'Session recovery could not be saved; a refresh may lose this unresolved receipt.' }
}

export function clearPendingReceiptRecovery(userId: string, orderId?: string, requestId?: string) {
  const storage = getStorage()
  if (!storage) return
  try {
    const current = readPendingReceiptRecovery(userId)
    if (!current || (orderId && current.orderId !== orderId) || (requestId && current.requestId !== requestId)) return
    storage.removeItem(storageKey(userId))
  } catch { /* Storage is optional recovery, never a request blocker. */ }
}

export function isValidRecovery(value: unknown): value is PendingReceiptRecovery {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  if (candidate.version !== schemaVersion || !isUuid(candidate.userId) || !isUuid(candidate.orderId) || !isUuid(candidate.requestId)) return false
  if (typeof candidate.payload !== 'object' || candidate.payload === null) return false
  const payload = candidate.payload as Record<string, unknown>
  if (payload.requestId !== candidate.requestId || !isNonEmpty(payload.rowVersion)) return false
  if (payload.referenceNumber !== null && payload.referenceNumber !== undefined && typeof payload.referenceNumber !== 'string') return false
  if (payload.notes !== null && payload.notes !== undefined && typeof payload.notes !== 'string') return false
  if (!Array.isArray(payload.lines) || payload.lines.length === 0) return false
  return payload.lines.every(line => typeof line === 'object' && line !== null && isUuid((line as Record<string, unknown>).purchaseOrderLineId) && Number.isInteger((line as Record<string, unknown>).quantity) && ((line as Record<string, unknown>).quantity as number) > 0)
}
