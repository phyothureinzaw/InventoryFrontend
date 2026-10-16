/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Autocomplete, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useAuth } from '../auth/AuthProvider'
import { getSupplier, getSuppliers, type Supplier } from '../master-data/api'
import { EmptyState, PageHeading, Pagination, QueryState } from '../master-data/components'
import { useDebouncedValue } from '../master-data/hooks'
import { localCalendarRange } from '../date-ranges'
import { getPurchaseOrders, type PurchaseOrderStatus, type PurchaseOrderSummary } from './api'
import { formatLocal, statusLabel } from './display'
import { StatusChip } from './StatusChip'

const statuses: PurchaseOrderStatus[] = ['Draft', 'Submitted', 'Approved', 'PartiallyReceived', 'Received', 'Cancelled']

export default function PurchaseOrdersPage() {
  const { request } = useAuth(); const navigate = useNavigate()
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search)
  const [supplierSearch, setSupplierSearch] = useState(''); const debouncedSupplierSearch = useDebouncedValue(supplierSearch); const [supplierPage, setSupplierPage] = useState(1)
  const [supplierId, setSupplierId] = useState(''); const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [status, setStatus] = useState(''); const [fromDate, setFromDate] = useState(''); const [toDate, setToDate] = useState(''); const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [debouncedSearch, supplierId, status, fromDate, toDate])
  useEffect(() => setSupplierPage(1), [debouncedSupplierSearch])
  const supplierDetail = useQuery({ queryKey: ['supplier', supplierId], queryFn: () => getSupplier(request, supplierId), enabled: Boolean(supplierId) })
  const suppliers = useQuery({ queryKey: ['suppliers', 'purchase-order-filter', { search: debouncedSupplierSearch, page: supplierPage }], queryFn: () => getSuppliers(request, { search: debouncedSupplierSearch, isActive: '', page: supplierPage, pageSize: 20 }) })
  const localRange = fromDate && toDate ? localCalendarRange(fromDate, toDate) : null
  const dateError = fromDate || toDate ? (!fromDate || !toDate ? 'Choose both a start and end date.' : !localRange ? 'Start date must be on or before end date.' : '') : ''
  const query = { search: debouncedSearch, supplierId, status, fromUtc: localRange?.fromUtc ?? '', toUtc: localRange?.toUtc ?? '', page, pageSize: 20 }
  const orders = useQuery({ queryKey: ['purchase-orders', 'list', query], queryFn: () => getPurchaseOrders(request, query), enabled: !dateError })
  const supplierOption = selectedSupplier ?? supplierDetail.data ?? suppliers.data?.items.find(item => item.id === supplierId) ?? null
  const filtered = Boolean(debouncedSearch || supplierId || status || fromDate || toDate)
  const reset = () => { setSearch(''); setSupplierSearch(''); setSupplierId(''); setSelectedSupplier(null); setStatus(''); setFromDate(''); setToDate(''); setPage(1) }
  return <Stack spacing={3}>
    <PageHeading eyebrow="Procurement / Workflow" title="Purchase Orders" description="Track supplier orders from draft through approval and receiving." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/purchase-orders/new')}>Create order</Button>} />
    <Paper sx={{ p: 2 }}><Stack spacing={1.5}><Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
      <TextField size="small" label="Search order number" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
      <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={event => setStatus(event.target.value)}><MenuItem value="">All statuses</MenuItem>{statuses.map(value => <MenuItem key={value} value={value}>{statusLabel(value)}</MenuItem>)}</Select></FormControl>
      <TextField size="small" type="date" label="Created from" value={fromDate} onChange={event => setFromDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" type="date" label="Created to" value={toDate} onChange={event => setToDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <Button onClick={reset} startIcon={<RefreshRoundedIcon />} disabled={!filtered}>Clear</Button>
    </Stack><SupplierFilter suppliers={suppliers.data?.items ?? []} selected={supplierOption} search={supplierSearch} onSearch={setSupplierSearch} page={supplierPage} totalCount={suppliers.data?.totalCount ?? 0} onPage={setSupplierPage} onChange={(id, supplier) => { setSupplierId(id); setSelectedSupplier(supplier) }} />{dateError && <Typography color="error" variant="body2">{dateError}</Typography>}</Stack></Paper>
    <QueryState isLoading={orders.isPending} isError={orders.isError} onRetry={() => orders.refetch()} filtered={filtered} empty={<EmptyState title="No purchase orders yet" body="Create a draft order to begin the procurement workflow." />}>
      {orders.data && orders.data.items.length === 0 ? <EmptyState title={filtered ? 'No matching orders' : 'No purchase orders yet'} body={filtered ? 'Try changing the search or filters.' : 'Create a draft order to begin the procurement workflow.'} /> : orders.data && <Paper sx={{ overflow: 'hidden' }}><Box sx={{ overflowX: 'auto' }}><Table sx={{ minWidth: 900 }}><TableHead><TableRow><TableCell>Order</TableCell><TableCell>Supplier</TableCell><TableCell>Status</TableCell><TableCell>Created by</TableCell><TableCell>Created</TableCell><TableCell>Progress</TableCell></TableRow></TableHead><TableBody>{orders.data.items.map(order => <OrderRow key={order.id} order={order} onOpen={() => navigate(`/purchase-orders/${order.id}`)} />)}</TableBody></Table></Box><Pagination page={orders.data.page} pageSize={orders.data.pageSize} totalCount={orders.data.totalCount} onPageChange={setPage} /></Paper>}
    </QueryState>
  </Stack>
}

function SupplierFilter({ suppliers, selected, search, onSearch, page, totalCount, onPage, onChange }: { suppliers: Supplier[]; selected: Supplier | null; search: string; onSearch: (value: string) => void; page: number; totalCount: number; onPage: (page: number) => void; onChange: (id: string, supplier: Supplier | null) => void }) {
  return <Box><Autocomplete options={suppliers} value={selected} isOptionEqualToValue={(option, value) => option.id === value.id} getOptionLabel={option => `${option.name}${option.isActive ? '' : ' (inactive)'}`} inputValue={search} onInputChange={(_, next, reason) => reason !== 'reset' && onSearch(next)} onChange={(_, next) => onChange(next?.id ?? '', next)} renderOption={(props, option) => <li {...props} key={option.id}><Stack><Typography sx={{ fontWeight: 700 }}>{option.name}</Typography>{!option.isActive && <Typography variant="caption" color="warning.main">Inactive historical supplier</Typography>}</Stack></li>} renderInput={params => <TextField {...params} size="small" label="Supplier filter" helperText="Includes inactive suppliers and is paginated." />} />{totalCount > 20 && <Pagination page={page} pageSize={20} totalCount={totalCount} onPageChange={onPage} />}</Box>
}

function OrderRow({ order, onOpen }: { order: PurchaseOrderSummary; onOpen: () => void }) {
  return <TableRow hover tabIndex={0} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onOpen() }} sx={{ cursor: 'pointer' }}><TableCell><Typography sx={{ fontWeight: 800 }}>{order.orderNumber}</Typography><Typography variant="caption" color="text.secondary">{order.lineCount} line{order.lineCount === 1 ? '' : 's'}</Typography></TableCell><TableCell>{order.supplierName}</TableCell><TableCell><StatusChip status={order.status} /></TableCell><TableCell>{order.createdByDisplayName}</TableCell><TableCell>{formatLocal(order.createdAtUtc)}</TableCell><TableCell>{order.receivedQuantity} / {order.orderedQuantity}</TableCell></TableRow>
}
