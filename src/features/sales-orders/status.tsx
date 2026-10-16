import { Chip } from '@mui/material'
import type { SalesOrderStatus } from './api'

export function SalesOrderStatusChip({ status }: { status: SalesOrderStatus }) {
  const color = status === 'Fulfilled' ? 'success' : status === 'Cancelled' ? 'default' : status === 'Draft' ? 'info' : 'warning'
  return <Chip size="small" label={status === 'PartiallyFulfilled' ? 'Partially fulfilled' : status} color={color} variant={status === 'Cancelled' ? 'outlined' : 'filled'} />
}
