import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequestSnapshot, nextRequestId, shouldAutoRetry } from '../../.frontend-test-dist/src/features/stock-movements/requestLifecycle.js'

test('uncertain retry reuses the same request ID and immutable payload', () => {
  const snapshot = createRequestSnapshot({ productId: 'p1', quantity: 4, requestId: 'same-id' }, 'same-id')
  const retry = snapshot
  assert.equal(retry.requestId, 'same-id')
  assert.deepEqual(retry.payload, { productId: 'p1', quantity: 4, requestId: 'same-id' })
  assert.equal(Object.isFrozen(retry), true)
  assert.equal(Object.isFrozen(retry.payload), true)
})

test('stock mutations do not automatically retry', () => {
  assert.equal(shouldAutoRetry(), false)
})

test('a confirmed completion can create a new request ID', () => {
  const completedId = 'completed-id'
  const nextId = nextRequestId()
  assert.notEqual(nextId, completedId)
  assert.match(nextId, /^[0-9a-f-]{36}$/i)
})
