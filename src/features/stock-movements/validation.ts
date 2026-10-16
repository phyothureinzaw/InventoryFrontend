export function validateStockOutQuantity(quantity: number, availableStock: number, reason: string) {
  if (!Number.isInteger(quantity) || quantity <= 0) return 'Quantity must be a positive whole number.'
  if (!reason.trim()) return 'Reason is required for stock-out.'
  if (quantity > availableStock) return 'Quantity cannot exceed available stock.'
  return ''
}
