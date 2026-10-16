/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { useAuth } from '../auth/AuthProvider'
import { createSupplier, errorMessage, getSuppliers, setSupplierStatus, updateSupplier, type Supplier, type SupplierForm } from '../master-data/api'
import { EmptyState, PageHeading, Pagination, QueryState } from '../master-data/components'
import { ActiveChip } from '../master-data/status'
import { useDebouncedValue } from '../master-data/hooks'

const blank: SupplierForm = { name: '', contactName: '', phone: '', email: '', address: '' }

export default function SuppliersPage() {
  const { request, user } = useAuth(); const queryClient = useQueryClient(); const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search); const [active, setActive] = useState(''); const [page, setPage] = useState(1); const [dialog, setDialog] = useState<Supplier | 'new' | null>(null); const [statusTarget, setStatusTarget] = useState<Supplier | null>(null); const [notice, setNotice] = useState('')
  useEffect(() => setPage(1), [debouncedSearch, active])
  const query = { search: debouncedSearch, isActive: active, page, pageSize: 20 }
  const suppliers = useQuery({ queryKey: ['suppliers', query], queryFn: () => getSuppliers(request, query) })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  const mutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setSupplierStatus(request, id, isActive), onSuccess: () => { setStatusTarget(null); setNotice('Supplier status updated. History is preserved.'); refresh() } })
  const filtered = Boolean(debouncedSearch || active)
  return <Stack spacing={3}>
    <PageHeading eyebrow="Partners / Supply" title="Suppliers" description="Maintain supplier contacts while keeping every historical movement intact." action={isAdmin ? <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog('new')}>New supplier</Button> : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    <Paper sx={{ p: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField size="small" label="Search suppliers" value={search} onChange={e => setSearch(e.target.value)} helperText="Searches name, contact, and email" fullWidth /><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select label="Status" value={active} onChange={e => setActive(e.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></Select></FormControl></Stack></Paper>
    <QueryState isLoading={suppliers.isPending} isError={suppliers.isError} onRetry={() => suppliers.refetch()} filtered={filtered} empty={<EmptyState title="No suppliers yet" body="Add a supplier when your first delivery partner is ready." />}>
      {suppliers.data && suppliers.data.items.length === 0 ? <EmptyState title={filtered ? 'No matching suppliers' : 'No suppliers yet'} body={filtered ? 'Try changing your search or filters.' : 'Add a supplier when your first delivery partner is ready.'} /> : suppliers.data && <Paper sx={{ overflow: 'hidden' }}><Table size="medium"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Contact</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{suppliers.data.items.map(supplier => <TableRow key={supplier.id} hover><TableCell sx={{ fontWeight: 700 }}>{supplier.name}</TableCell><TableCell>{supplier.contactName || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell>{supplier.phone || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell sx={{ wordBreak: 'break-word' }}>{supplier.email || <Typography color="text.secondary">—</Typography>}</TableCell><TableCell><ActiveChip isActive={supplier.isActive} /></TableCell><TableCell align="right">{isAdmin && <Stack direction="row" sx={{ justifyContent: 'flex-end' }}><Tooltip title="Edit"><IconButton aria-label={`Edit ${supplier.name}`} onClick={() => setDialog(supplier)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip><Button size="small" color={supplier.isActive ? 'inherit' : 'success'} onClick={() => setStatusTarget(supplier)}>{supplier.isActive ? 'Deactivate' : 'Reactivate'}</Button></Stack>}</TableCell></TableRow>)}</TableBody></Table><Pagination page={suppliers.data.page} pageSize={suppliers.data.pageSize} totalCount={suppliers.data.totalCount} onPageChange={setPage} /></Paper>}
    </QueryState>
    <SupplierDialog value={dialog} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setNotice('Supplier saved successfully.'); refresh() }} request={request} />
    <Dialog open={Boolean(statusTarget)} onClose={mutation.isPending ? undefined : () => setStatusTarget(null)} fullWidth maxWidth="xs"><DialogTitle>{statusTarget?.isActive ? 'Deactivate supplier?' : 'Reactivate supplier?'}</DialogTitle><DialogContent><Alert severity={statusTarget?.isActive ? 'warning' : 'info'}>Deactivation preserves movement history and does not remove existing records.</Alert></DialogContent><DialogActions><Button onClick={() => setStatusTarget(null)}>Cancel</Button><Button variant="contained" color={statusTarget?.isActive ? 'warning' : 'success'} onClick={() => statusTarget && mutation.mutate({ id: statusTarget.id, isActive: !statusTarget.isActive })} disabled={mutation.isPending}>{mutation.isPending ? 'Updating...' : statusTarget?.isActive ? 'Deactivate' : 'Reactivate'}</Button></DialogActions></Dialog>
    {mutation.isError && <Alert severity="error">{errorMessage(mutation.error, 'Unable to update supplier status.')}</Alert>}
  </Stack>
}

function SupplierDialog({ value, onClose, onSaved, request }: { value: Supplier | 'new' | null; onClose: () => void; onSaved: () => void; request: <T>(path: string, options?: RequestInit) => Promise<T> }) {
  const [form, setForm] = useState<SupplierForm>(blank); const [error, setError] = useState('')
  useEffect(() => { setForm(value && value !== 'new' ? { name: value.name, contactName: value.contactName ?? '', phone: value.phone ?? '', email: value.email ?? '', address: value.address ?? '' } : blank); setError('') }, [value])
  const mutation = useMutation({ mutationFn: () => value && value !== 'new' ? updateSupplier(request, value.id, form) : createSupplier(request, form), onSuccess: onSaved, onError: e => setError(errorMessage(e, 'Unable to save supplier.')) })
  const set = (field: keyof SupplierForm) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(current => ({ ...current, [field]: event.target.value }))
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim()) return setError('Supplier name is required.'); mutation.mutate() }
  return <Dialog open={value !== null} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm"><BoxForm onSubmit={submit}><DialogTitle>{value === 'new' ? 'New supplier' : 'Edit supplier'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Supplier name" value={form.name} onChange={set('name')} slotProps={{ htmlInput: { maxLength: 200 } }} required autoFocus /><TextField label="Contact name" value={form.contactName} onChange={set('contactName')} slotProps={{ htmlInput: { maxLength: 120 } }} /><TextField label="Phone" value={form.phone} onChange={set('phone')} slotProps={{ htmlInput: { maxLength: 40 } }} /><TextField label="Email" type="email" value={form.email} onChange={set('email')} slotProps={{ htmlInput: { maxLength: 320 } }} /><TextField label="Address" multiline minRows={2} value={form.address} onChange={set('address')} slotProps={{ htmlInput: { maxLength: 500 } }} /></Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button><Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save supplier'}</Button></DialogActions></BoxForm></Dialog>
}

function BoxForm({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit}>{children}</form> }
