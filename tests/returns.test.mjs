import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateByProduct, canPostReturns, validateReturnLines } from '../../.frontend-test-dist/src/features/returns/validation.js'
import { clearPendingReturnRecovery, isValidReturnRecovery, readPendingReturns, savePendingReturnRecovery } from '../../.frontend-test-dist/src/features/returns/recovery.js'

const storage = new Map()
globalThis.window = { sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key), get length() { return storage.size }, key: index => [...storage.keys()][index] ?? null } }
const userA = '11111111-1111-4111-8111-111111111111'
const userB = '22222222-2222-4222-8222-222222222222'
const sourceA = '33333333-3333-4333-8333-333333333333'
const sourceB = '44444444-4444-4444-8444-444444444444'
const lineA = '55555555-5555-4555-8555-555555555555'
const lineB = '66666666-6666-4666-8666-666666666666'

function pending(kind, sourceId, requestId, quantity = 1) { return { version: 1, kind, sourceId, requestId, inspected: kind === 'customer', payload: kind === 'customer' ? { requestId, salesFulfillmentId: sourceId, reason: 'Inspected', referenceNumber: null, notes: null, lines: [{ salesFulfillmentLineId: lineA, quantity }] } : { requestId, purchaseReceiptId: sourceId, reason: 'Supplier issue', referenceNumber: null, notes: null, lines: [{ purchaseReceiptLineId: lineA, quantity }] } } }

test('return posting controls are Admin-only and quantities require positive returnable subsets', () => {
  assert.equal(canPostReturns('Admin'), true)
  assert.equal(canPostReturns('Staff'), false)
  const lines = [{ id: lineA, productId: 'product-a', productSku: 'A', productName: 'A', productUnit: 'each', quantity: 3, returnedQuantity: 1, returnableQuantity: 2, currentStock: 4, reservedStock: 1, availableStock: 3 }]
  assert.match(validateReturnLines('supplier', lines, {}, false).error, /at least one/i)
  assert.match(validateReturnLines('supplier', lines, { [lineA]: '3' }, false).error, /exceed/i)
  assert.equal(validateReturnLines('supplier', lines, { [lineA]: '2' }, false).selected[0].quantity, 2)
  assert.match(validateReturnLines('customer', lines, { [lineA]: '1' }, false).error, /inspected/i)
})

test('supplier summaries aggregate same-product source lines', () => {
  const lines = [
    { id: lineA, productId: 'product-a', productSku: 'A', productName: 'A', productUnit: 'each', quantity: 3, returnedQuantity: 0, returnableQuantity: 3, currentStock: 8, reservedStock: 2, availableStock: 6 },
    { id: lineB, productId: 'product-a', productSku: 'A', productName: 'A', productUnit: 'each', quantity: 2, returnedQuantity: 0, returnableQuantity: 2, currentStock: 8, reservedStock: 2, availableStock: 6 },
  ]
  assert.deepEqual(aggregateByProduct(lines, [{ id: lineA, quantity: 1 }, { id: lineB, quantity: 2 }]), [{ productId: 'product-a', productSku: 'A', productName: 'A', productUnit: 'each', quantity: 3, availableStock: 6 }])
})

test('return recovery isolates user, kind, and source while preserving exact payload', () => {
  const customer = pending('customer', sourceA, '77777777-7777-4777-8777-777777777777')
  const supplier = pending('supplier', sourceA, '88888888-8888-4888-8888-888888888888')
  const otherSource = pending('customer', sourceB, '99999999-9999-4999-8999-999999999999', 2)
  assert.equal(savePendingReturnRecovery({ userId: userA, snapshot: customer }), '')
  assert.equal(savePendingReturnRecovery({ userId: userA, snapshot: supplier }), '')
  assert.equal(savePendingReturnRecovery({ userId: userA, snapshot: otherSource }), '')
  assert.deepEqual(readPendingReturns(userA, 'customer', sourceA)[0].payload, customer.payload)
  assert.equal(readPendingReturns(userA, 'supplier', sourceA)[0].requestId, supplier.requestId)
  assert.equal(readPendingReturns(userA, 'customer', sourceB)[0].requestId, otherSource.requestId)
  assert.equal(readPendingReturns(userB).length, 0)
  assert.equal(isValidReturnRecovery(readPendingReturns(userA, 'supplier', sourceA)[0]), true)
  clearPendingReturnRecovery(userA, 'customer', sourceA, customer.requestId)
  assert.equal(readPendingReturns(userA, 'customer', sourceA).length, 0)
  assert.equal(readPendingReturns(userA, 'supplier', sourceA).length, 1)
})

test('invalid return recovery is rejected', () => {
  assert.equal(isValidReturnRecovery({ version: 1, userId: userA, kind: 'customer', sourceId: sourceA, requestId: 'bad', inspected: true, payload: {} }), false)
})
