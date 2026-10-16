import assert from 'node:assert/strict'
import test from 'node:test'
import { createFulfillmentSnapshot, clearPendingFulfillmentRecovery, isValidFulfillmentRecovery, readPendingFulfillmentRecovery, savePendingFulfillmentRecovery } from '../../.frontend-test-dist/src/features/sales-orders/recovery.js'
import { salesOrderActions, validateFulfillmentLines } from '../../.frontend-test-dist/src/features/sales-orders/validation.js'
import { validateStockOutQuantity } from '../../.frontend-test-dist/src/features/stock-movements/validation.js'
import { customerActions, customerUpdatePayload } from '../../.frontend-test-dist/src/features/customers/validation.js'

const storage = new Map()
globalThis.window = { sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key), get length() { return storage.size }, key: index => [...storage.keys()][index] ?? null } }
const user = '11111111-1111-4111-8111-111111111111'; const otherUser = '22222222-2222-4222-8222-222222222222'; const order = '33333333-3333-4333-8333-333333333333'; const secondOrder = '66666666-6666-4666-8666-666666666666'; const line = '44444444-4444-4444-8444-444444444444'

test('sales-order actions enforce role and lifecycle', () => {
  assert.deepEqual(salesOrderActions('Draft', 'Staff'), { edit: true, confirm: false, cancel: false, fulfill: false })
  assert.deepEqual(salesOrderActions('Confirmed', 'Staff'), { edit: false, confirm: false, cancel: false, fulfill: true })
  assert.deepEqual(salesOrderActions('Confirmed', 'Admin'), { edit: false, confirm: false, cancel: true, fulfill: true })
  assert.deepEqual(salesOrderActions('Fulfilled', 'Admin'), { edit: false, confirm: false, cancel: false, fulfill: false })
})

test('customer management is admin-only while reads remain available', () => {
  assert.deepEqual(customerActions('Admin'), { canManage: true, canRead: true })
  assert.deepEqual(customerActions('Staff'), { canManage: false, canRead: true })
  assert.equal(customerUpdatePayload({ name: 'A', contactName: '', phone: '', email: '', address: '' }, 'row-v2').rowVersion, 'row-v2')
})

test('fulfillment validation is bounded by active reservations', () => {
  const lines = [{ id: line, activeReservationQuantity: 3 }]
  assert.match(validateFulfillmentLines(lines, {}).error, /at least one/)
  assert.match(validateFulfillmentLines(lines, { [line]: '4' }).error, /cannot exceed/)
  assert.equal(validateFulfillmentLines(lines, { [line]: '2' }).selected[0].quantity, 2)
})

test('fulfillment recovery restores only the same user and exact retry payload', () => {
  const snapshot = createFulfillmentSnapshot({ rowVersion: 'rv-1', referenceNumber: 'REF', notes: 'note', lines: [{ salesOrderLineId: line, quantity: 2 }] }, '55555555-5555-4555-8555-555555555555')
  assert.equal(savePendingFulfillmentRecovery({ userId: user, orderId: order, snapshot }), '')
  assert.deepEqual(readPendingFulfillmentRecovery(user, order)[0].payload, snapshot.payload)
  assert.equal(readPendingFulfillmentRecovery(otherUser, order).length, 0)
  clearPendingFulfillmentRecovery(user, order, snapshot.requestId)
  assert.equal(readPendingFulfillmentRecovery(user, order).length, 0)
})

test('fulfillment recovery isolates multiple orders for one user', () => {
  const first = createFulfillmentSnapshot({ rowVersion: 'rv-a', referenceNumber: null, notes: null, lines: [{ salesOrderLineId: line, quantity: 1 }] }, '77777777-7777-4777-8777-777777777777')
  const second = createFulfillmentSnapshot({ rowVersion: 'rv-b', referenceNumber: null, notes: null, lines: [{ salesOrderLineId: line, quantity: 2 }] }, '88888888-8888-4888-8888-888888888888')
  savePendingFulfillmentRecovery({ userId: user, orderId: order, snapshot: first }); savePendingFulfillmentRecovery({ userId: user, orderId: secondOrder, snapshot: second })
  assert.deepEqual(readPendingFulfillmentRecovery(user).map(value => value.orderId).sort(), [order, secondOrder].sort())
  assert.equal(readPendingFulfillmentRecovery(user, order)[0].requestId, first.requestId)
  assert.equal(readPendingFulfillmentRecovery(user, secondOrder)[0].requestId, second.requestId)
  clearPendingFulfillmentRecovery(user, order, first.requestId); clearPendingFulfillmentRecovery(user, secondOrder, second.requestId)
})

test('invalid fulfillment recovery is rejected', () => {
  assert.equal(isValidFulfillmentRecovery({ version: 1, userId: user, orderId: order, requestId: 'bad', payload: {} }), false)
})

test('standalone stock-out validation uses available stock', () => {
  assert.equal(validateStockOutQuantity(5, 4, 'issue'), 'Quantity cannot exceed available stock.')
  assert.equal(validateStockOutQuantity(4, 4, 'issue'), '')
  assert.match(validateStockOutQuantity(1, 4, ''), /Reason is required/)
})
