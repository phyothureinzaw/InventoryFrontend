import type { ReturnKind, SourceLine } from './api'

export type ReturnSelection = { id: string; quantity: number }
export function canPostReturns(role: 'Admin' | 'Staff' | undefined) { return role === 'Admin' }
export function validateReturnLines(kind: ReturnKind, lines: SourceLine[], quantities: Record<string, string>, inspected: boolean) {
  if (kind === 'customer' && !inspected) return { error: 'Confirm that the returned goods were inspected and accepted into usable stock.', selected: [] as ReturnSelection[] }
  const selected = lines.filter(line => quantities[line.id] !== undefined && quantities[line.id] !== '').map(line => ({ id: line.id, quantity: Number(quantities[line.id]) }))
  if (!selected.length) return { error: 'Select at least one source line.', selected }
  if (selected.some(item => !Number.isInteger(item.quantity) || item.quantity <= 0)) return { error: 'Return quantities must be positive whole numbers.', selected }
  if (selected.some(item => { const source = lines.find(line => line.id === item.id)!; return item.quantity > source.returnableQuantity })) return { error: 'A return quantity cannot exceed the remaining returnable quantity.', selected }
  return { error: '', selected }
}

export function aggregateByProduct(lines: SourceLine[], selected: ReturnSelection[]) {
  const result = new Map<string, { productId: string; productSku: string; productName: string; productUnit: string; quantity: number; availableStock: number }>()
  selected.forEach(item => { const source = lines.find(line => line.id === item.id); if (!source) return; const existing = result.get(source.productId); if (existing) existing.quantity += item.quantity; else result.set(source.productId, { productId: source.productId, productSku: source.productSku, productName: source.productName, productUnit: source.productUnit, quantity: item.quantity, availableStock: source.availableStock }) })
  return [...result.values()]
}
