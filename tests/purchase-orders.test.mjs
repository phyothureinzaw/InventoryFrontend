import assert from 'node:assert/strict'
import test from 'node:test'
import { createReceiptSnapshot } from '../../.frontend-test-dist/src/features/purchase-orders/lifecycle.js'
import { purchaseOrderActions, validateReceiptLines } from '../../.frontend-test-dist/src/features/purchase-orders/validation.js'
import { clearPendingReceiptRecovery, isValidRecovery, readPendingReceiptRecovery, savePendingReceiptRecovery } from '../../.frontend-test-dist/src/features/purchase-orders/recovery.js'

const storage = new Map()
globalThis.window = { sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } }
const userA = '11111111-1111-4111-8111-111111111111'
const userB = '22222222-2222-4222-8222-222222222222'
const orderId = '33333333-3333-4333-8333-333333333333'

test('receipt snapshot preserves one immutable payload for identical retry', () => {
  const snapshot = createReceiptSnapshot({ rowVersion: 'rv-1', referenceNumber: 'REF', notes: null, lines: [{ purchaseOrderLineId: 'line-a', quantity: 2 }] }, 'receipt-id')
  assert.equal(snapshot.requestId, 'receipt-id')
  assert.equal(snapshot.payload.requestId, 'receipt-id')
  assert.equal(Object.isFrozen(snapshot), true)
  assert.equal(Object.isFrozen(snapshot.payload), true)
  assert.equal(Object.isFrozen(snapshot.payload.lines), true)
  assert.deepEqual(snapshot.payload.lines, [{ purchaseOrderLineId: 'line-a', quantity: 2 }])
})

test('receipt validation requires positive quantities within displayed remainder', () => {
  const lines = [{ id: 'a', remainingQuantity: 3 }, { id: 'b', remainingQuantity: 1 }]
  assert.equal(validateReceiptLines(lines, {}).error, 'Enter a positive quantity for at least one line.')
  assert.match(validateReceiptLines(lines, { a: '4' }).error, /cannot exceed/)
  assert.equal(validateReceiptLines(lines, { a: '2' }).selected[0].quantity, 2)
  assert.match(validateReceiptLines(lines, { a: '1.5' }).error, /positive whole numbers/)
})

test('purchase-order action visibility follows role and status', () => {
  assert.deepEqual(purchaseOrderActions('Draft', 'Staff'), { edit: true, submit: true, approve: false, cancel: false, receive: false })
  assert.deepEqual(purchaseOrderActions('Submitted', 'Admin'), { edit: false, submit: false, approve: true, cancel: true, receive: false })
  assert.deepEqual(purchaseOrderActions('PartiallyReceived', 'Staff'), { edit: false, submit: false, approve: false, cancel: false, receive: true })
  assert.deepEqual(purchaseOrderActions('Received', 'Admin'), { edit: false, submit: false, approve: false, cancel: false, receive: false })
})

test('pending receipt survives refresh and restores only for the same user', () => {
  const snapshot = createReceiptSnapshot({ rowVersion: 'rv', referenceNumber: 'R', notes: 'N', lines: [{ purchaseOrderLineId: '44444444-4444-4444-8444-444444444444', quantity: 2 }] }, '55555555-5555-4555-8555-555555555555')
  assert.equal(savePendingReceiptRecovery({ userId: userA, orderId, snapshot }), null)
  const restored = readPendingReceiptRecovery(userA, orderId)
  assert.equal(restored.requestId, snapshot.requestId)
  assert.deepEqual(restored.payload, snapshot.payload)
  assert.equal(readPendingReceiptRecovery(userB), null)
})

test('recovery preserves exact retry payload and clears after confirmed completion', () => {
  const snapshot = createReceiptSnapshot({ rowVersion: 'rv', referenceNumber: null, notes: null, lines: [{ purchaseOrderLineId: '66666666-6666-4666-8666-666666666666', quantity: 1 }] }, '77777777-7777-4777-8777-777777777777')
  savePendingReceiptRecovery({ userId: userA, orderId, snapshot })
  const restored = readPendingReceiptRecovery(userA)
  assert.deepEqual(restored.payload, snapshot.payload)
  clearPendingReceiptRecovery(userA, orderId, snapshot.requestId)
  assert.equal(readPendingReceiptRecovery(userA), null)
})

test('invalid stored recovery data is rejected', () => {
  storage.set(`inventory.pending-receipt.${userA}`, JSON.stringify({ version: 1, userId: userA, orderId, requestId: 'bad', payload: {} }))
  assert.equal(readPendingReceiptRecovery(userA), null)
  assert.equal(isValidRecovery({ version: 1, userId: userA, orderId, requestId: 'bad', payload: {} }), false)
})
