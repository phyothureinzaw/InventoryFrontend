export type ReceiptSnapshotPayload = Readonly<{
  requestId: string
  rowVersion: string
  referenceNumber: string | null
  notes: string | null
  lines: ReadonlyArray<Readonly<{ purchaseOrderLineId: string; quantity: number }>>
}>
export type ReceiptSnapshot = Readonly<{ requestId: string; payload: ReceiptSnapshotPayload }>

export function createReceiptSnapshot(payload: Omit<ReceiptSnapshotPayload, 'requestId'>, requestId = crypto.randomUUID()): ReceiptSnapshot {
  const lines = Object.freeze(payload.lines.map(line => Object.freeze({ ...line })))
  const snapshotPayload = Object.freeze({ ...payload, requestId, lines })
  return Object.freeze({ requestId, payload: snapshotPayload })
}

export function receiptErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'problem' in error
    ? (error as { problem?: { code?: string } }).problem?.code
    : undefined
}

export function isReceiptReviewError(error: unknown) {
  const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: unknown }).status : undefined
  return typeof status === 'number' && status >= 400 && status < 500
}
