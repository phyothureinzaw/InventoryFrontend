import { Chip } from '@mui/material'
import type { PurchaseOrderStatus } from './api'
import { statusColor, statusLabel } from './display'

export function StatusChip({ status }: { status: PurchaseOrderStatus }) { return <Chip size="small" color={statusColor(status)} label={statusLabel(status)} /> }
