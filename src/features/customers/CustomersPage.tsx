/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { ApiError } from '../../api/client'
import { useAuth } from '../auth/AuthProvider'
import { createCustomer, errorMessage, getCustomers, setCustomerStatus, updateCustomer, type Customer, type CustomerForm } from '../master-data/api'
import { EmptyState, PageHeading, Pagination, QueryState } from '../master-data/components'
import { ActiveChip } from '../master-data/status'
import { useDebouncedValue } from '../master-data/hooks'
import { customerActions, customerUpdatePayload } from './validation'

const blank: CustomerForm = { name: '', contactName: '', phone: '', email: '', address: '' }

export default function CustomersPage() {
  const { request, user } = useAuth(); const queryClient = useQueryClient(); const isAdmin = customerActions(user?.role === 'Admin' ? 'Admin' : 'Staff').canManage
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search); const [active, setActive] = useState(''); const [page, setPage] = useState(1); const [dialog, setDialog] = useState<Customer | 'new' | null>(null); const [statusTarget, setStatusTarget] = useState<Customer | null>(null); const [notice, setNotice] = useState('')
  useEffect(() => setPage(1), [debouncedSearch, active])
  const query = { search: debouncedSearch, isActive: active, page, pageSize: 20 }
  const customers = useQuery({ queryKey: ['customers', query], queryFn: () => getCustomers(request, query) })
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ['customers'] }), queryClient.invalidateQueries({ queryKey: ['sales-orders'] }), queryClient.invalidateQueries({ queryKey: ['sales-order'] })])
  const statusMutation = useMutation({ mutationFn: ({ customer, isActive }: { customer: Customer; isActive: boolean }) => setCustomerStatus(request, customer.id, isActive, customer.rowVersion), onSuccess: () => { setStatusTarget(null); setNotice('Customer status updated. History is preserved.'); refresh() } })
  const filtered = Boolean(debouncedSearch || active)
  return <Stack spacing={3}>
    <PageHeading eyebrow="Customers / Accounts" title="Customers" description="Maintain customer contacts while keeping historical transactions intact." action={isAdmin ? <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog('new')}>New customer</Button> : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    <Paper sx={{ p: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField size="small" label="Search customers" value={search} onChange={e => setSearch(e.target.value)} helperText="Searches name, contact, and email" fullWidth /><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select label="Status" value={active} onChange={e => setActive(e.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></Select></FormControl></Stack></Paper>
    <QueryState isLoading={customers.isPending} isError={customers.isError} onRetry={() => customers.refetch()} filtered={filtered} empty={<EmptyState title="No customers yet" body="Add a customer when your first account is ready." />}>
      {customers.data && customers.data.items.length === 0 ? <EmptyState title={filtered ? 'No matching customers' : 'No customers yet'} body={filtered ? 'Try changing your search or filters.' : 'Add a customer when your first account is ready.'} /> : customers.data && <Paper sx={{ overflow: 'hidden' }}><Stack sx={{ overflowX: 'auto' }}><Table size="medium" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Contact</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{customers.data.items.map(customer => <TableRow key={customer.id} hover><TableCell><Typography sx={{ fontWeight: 700 }}>{customer.name}</Typography>{customer.address && <Typography variant="body2" color="text.secondary">{customer.address}</Typography>}</TableCell><TableCell>{customer.contactName || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell>{customer.phone || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell sx={{ wordBreak: 'break-word' }}>{customer.email || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell><ActiveChip isActive={customer.isActive} /></TableCell><TableCell align="right">{isAdmin && <Stack direction="row" sx={{ justifyContent: 'flex-end' }}><Tooltip title="Edit"><IconButton aria-label={`Edit ${customer.name}`} onClick={() => setDialog(customer)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip><Button size="small" color={customer.isActive ? 'inherit' : 'success'} onClick={() => setStatusTarget(customer)}>{customer.isActive ? 'Deactivate' : 'Reactivate'}</Button></Stack>}</TableCell></TableRow>)}</TableBody></Table></Stack><Pagination page={customers.data.page} pageSize={customers.data.pageSize} totalCount={customers.data.totalCount} onPageChange={setPage} /></Paper>}
    </QueryState>
    <CustomerDialog value={dialog} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setNotice('Customer saved successfully.'); refresh() }} onReload={() => { setDialog(null); refresh() }} request={request} />
    <Dialog open={Boolean(statusTarget)} onClose={statusMutation.isPending ? undefined : () => setStatusTarget(null)} fullWidth maxWidth="xs"><DialogTitle>{statusTarget?.isActive ? 'Deactivate customer?' : 'Reactivate customer?'}</DialogTitle><DialogContent><Alert severity={statusTarget?.isActive ? 'warning' : 'info'}>Deactivation preserves customer history and does not remove existing records.</Alert>{statusMutation.isError && <Alert severity="error" sx={{ mt: 2 }} action={isStale(statusMutation.error) ? <Button color="inherit" size="small" onClick={() => { setStatusTarget(null); refresh() }}>Reload</Button> : undefined}>{statusError(statusMutation.error)}</Alert>}</DialogContent><DialogActions><Button onClick={() => setStatusTarget(null)}>Cancel</Button><Button variant="contained" color={statusTarget?.isActive ? 'warning' : 'success'} onClick={() => statusTarget && statusMutation.mutate({ customer: statusTarget, isActive: !statusTarget.isActive })} disabled={statusMutation.isPending}>{statusMutation.isPending ? 'Updating...' : statusTarget?.isActive ? 'Deactivate' : 'Reactivate'}</Button></DialogActions></Dialog>
  </Stack>
}

function isStale(error: unknown) { return error instanceof ApiError && error.status === 409 }
function statusError(error: unknown) { return isStale(error) ? 'This customer changed since it was loaded. Reload the customer, review the current details, and then try again.' : errorMessage(error, 'Unable to update customer status.') }

function CustomerDialog({ value, onClose, onSaved, onReload, request }: { value: Customer | 'new' | null; onClose: () => void; onSaved: () => void; onReload: () => void; request: <T>(path: string, options?: RequestInit) => Promise<T> }) {
  const [form, setForm] = useState<CustomerForm>(blank); const [error, setError] = useState('')
  useEffect(() => { setForm(value && value !== 'new' ? { name: value.name, contactName: value.contactName ?? '', phone: value.phone ?? '', email: value.email ?? '', address: value.address ?? '' } : blank); setError('') }, [value])
  const mutation = useMutation({ mutationFn: () => value && value !== 'new' ? updateCustomer(request, value.id, customerUpdatePayload(form, value.rowVersion)) : createCustomer(request, form), onSuccess: onSaved, onError: e => setError(customerError(e)) })
  const set = (field: keyof CustomerForm) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [field]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim()) return setError('Customer name is required.'); mutation.mutate() }
  const stale = isStale(mutation.error)
  return <Dialog open={value !== null} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm"><BoxForm onSubmit={submit}><DialogTitle>{value === 'new' ? 'New customer' : 'Edit customer'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error" action={stale ? <Button color="inherit" size="small" onClick={onReload}>Reload</Button> : undefined}>{error}</Alert>}<TextField label="Customer name" value={form.name} onChange={set('name')} slotProps={{ htmlInput: { maxLength: 200 } }} required autoFocus /><TextField label="Contact name" value={form.contactName} onChange={set('contactName')} slotProps={{ htmlInput: { maxLength: 200 } }} /><TextField label="Email" type="email" value={form.email} onChange={set('email')} slotProps={{ htmlInput: { maxLength: 256 } }} /><TextField label="Phone" value={form.phone} onChange={set('phone')} slotProps={{ htmlInput: { maxLength: 32 } }} /><TextField label="Address" multiline minRows={2} value={form.address} onChange={set('address')} slotProps={{ htmlInput: { maxLength: 500 } }} /></Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button><Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save customer'}</Button></DialogActions></BoxForm></Dialog>
}

function customerError(error: unknown) { return isStale(error) ? 'This customer changed since it was loaded. Reload it, review the current details, and then try again.' : errorMessage(error, 'Unable to save customer.') }
function BoxForm({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit}>{children}</form> }
