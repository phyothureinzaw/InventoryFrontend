import assert from 'node:assert/strict'
import test from 'node:test'
import { localCalendarRange, utcCalendarRange, utcChartLabel, validUtcRange } from '../../.frontend-test-dist/src/features/date-ranges.js'

test('local history dates convert local midnight to inclusive/exclusive UTC boundaries', () => {
  const range = localCalendarRange('2026-03-08', '2026-03-09')
  assert.ok(range)
  assert.equal(range.fromUtc, new Date(2026, 2, 8).toISOString())
  assert.equal(range.toUtc, new Date(2026, 2, 10).toISOString())
})

test('UTC dashboard range preserves inclusive start and exclusive end', () => {
  assert.deepEqual(utcCalendarRange('2026-02-01', '2026-02-01'), { fromUtc: '2026-02-01T00:00:00.000Z', toUtc: '2026-02-02T00:00:00.000Z' })
})

test('UTC chart labels retain the server date without local shifting', () => {
  assert.equal(utcChartLabel('2026-12-31'), '2026-12-31')
})

test('dashboard ranges enforce the 366-day API maximum', () => {
  assert.equal(validUtcRange('2026-01-01', '2027-01-01'), true)
  assert.equal(validUtcRange('2026-01-01', '2027-01-02'), false)
  assert.equal(validUtcRange('2026-02-02', '2026-02-01'), false)
})
