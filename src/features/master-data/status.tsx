import { Chip } from '@mui/material'

export function ActiveChip({ isActive }: { isActive: boolean }) { return <Chip size="small" label={isActive ? 'Active' : 'Inactive'} color={isActive ? 'success' : 'default'} variant={isActive ? 'filled' : 'outlined'} /> }
export function StockChip({ product }: { product: { currentStock: number; reservedStock?: number; availableStock?: number; isLowStock: boolean } }) {
  const balance = `Available ${product.availableStock ?? product.currentStock} · Reserved ${product.reservedStock ?? 0}`
  if (product.currentStock === 0) return <Chip size="small" label={`Out of stock · ${balance}`} color="error" />
  if (product.isLowStock) return <Chip size="small" label={`Low stock · ${balance}`} color="warning" />
  return <Chip size="small" label={`Available ${product.availableStock ?? product.currentStock} · Reserved ${product.reservedStock ?? 0}`} color="success" variant="outlined" />
}
