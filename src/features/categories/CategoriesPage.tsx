import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
/* eslint-disable react-hooks/set-state-in-effect */
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { ApiError } from '../../api/client'
import { useAuth } from '../auth/AuthProvider'
import { createCategory, errorMessage, getCategories, setCategoryStatus, updateCategory, type Category } from '../master-data/api'
import { EmptyState, PageHeading, Pagination, QueryState } from '../master-data/components'
import { ActiveChip } from '../master-data/status'
import { useDebouncedValue } from '../master-data/hooks'

export default function CategoriesPage() {
  const { request, user } = useAuth(); const queryClient = useQueryClient(); const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState(''); const debouncedSearch = useDebouncedValue(search); const [active, setActive] = useState(''); const [page, setPage] = useState(1); const [dialog, setDialog] = useState<Category | 'new' | null>(null); const [statusTarget, setStatusTarget] = useState<Category | null>(null); const [notice, setNotice] = useState('')
  useEffect(() => setPage(1), [debouncedSearch, active])
  const query = { search: debouncedSearch, isActive: active, page, pageSize: 20 }
  const categories = useQuery({ queryKey: ['categories', query], queryFn: () => getCategories(request, query) })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  const mutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setCategoryStatus(request, id, isActive), onSuccess: () => { setNotice('Category status updated. History is preserved.'); setStatusTarget(null); refresh() } })
  const filtered = Boolean(debouncedSearch || active)
  return <Stack spacing={3}>
    <PageHeading eyebrow="Catalog / Taxonomy" title="Categories" description="Keep the product catalog organized without losing historical movement records." action={isAdmin ? <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog('new')}>New category</Button> : undefined} />
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    <Paper sx={{ p: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField size="small" label="Search categories" value={search} onChange={e => setSearch(e.target.value)} fullWidth /><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select label="Status" value={active} onChange={e => setActive(e.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></Select></FormControl></Stack></Paper>
    <QueryState isLoading={categories.isPending} isError={categories.isError} onRetry={() => categories.refetch()} filtered={filtered} empty={<EmptyState title="No categories yet" body="Create the first category to start organizing products." />}>
      {categories.data && categories.data.items.length === 0 ? <EmptyState title={filtered ? 'No matching categories' : 'No categories yet'} body={filtered ? 'Try changing your search or filters.' : 'Create the first category to start organizing products.'} /> : categories.data && <Paper sx={{ overflow: 'hidden' }}><Table size="medium"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{categories.data.items.map(category => <TableRow key={category.id} hover><TableCell sx={{ fontWeight: 700 }}>{category.name}</TableCell><TableCell><ActiveChip isActive={category.isActive} /></TableCell><TableCell align="right">{isAdmin && <Stack direction="row" sx={{ justifyContent: 'flex-end' }}><Tooltip title="Edit"><IconButton aria-label={`Edit ${category.name}`} onClick={() => setDialog(category)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip><Button size="small" color={category.isActive ? 'inherit' : 'success'} onClick={() => setStatusTarget(category)}>{category.isActive ? 'Deactivate' : 'Reactivate'}</Button></Stack>}</TableCell></TableRow>)}</TableBody></Table><Pagination page={categories.data.page} pageSize={categories.data.pageSize} totalCount={categories.data.totalCount} onPageChange={setPage} /></Paper>}
    </QueryState>
    <CategoryDialog value={dialog} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setNotice('Category saved successfully.'); refresh() }} request={request} />
    <StatusDialog category={statusTarget} onClose={() => setStatusTarget(null)} onConfirm={() => statusTarget && mutation.mutate({ id: statusTarget.id, isActive: !statusTarget.isActive })} isPending={mutation.isPending} />
    {mutation.isError && <Alert severity="error">{mutation.error instanceof ApiError && mutation.error.status === 409 ? 'This category cannot be deactivated while it has active products.' : errorMessage(mutation.error, 'Unable to update category status.')}</Alert>}
  </Stack>
}

function CategoryDialog({ value, onClose, onSaved, request }: { value: Category | 'new' | null; onClose: () => void; onSaved: () => void; request: <T>(path: string, options?: RequestInit) => Promise<T> }) {
  const [name, setName] = useState(''); const [error, setError] = useState('');
  useEffect(() => { setName(value && value !== 'new' ? value.name : ''); setError('') }, [value])
  const mutation = useMutation({ mutationFn: () => value && value !== 'new' ? updateCategory(request, value.id, { name: name.trim() }) : createCategory(request, { name: name.trim() }), onSuccess: onSaved, onError: e => setError(e instanceof ApiError && e.status === 409 ? 'A category with that normalized name already exists.' : errorMessage(e, 'Unable to save category.')) })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return setError('Name is required.'); mutation.mutate() }
  return <Dialog open={value !== null} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm"><BoxForm onSubmit={submit}><DialogTitle>{value === 'new' ? 'New category' : 'Edit category'}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}>{error && <Alert severity="error">{error}</Alert>}<TextField label="Category name" value={name} onChange={e => setName(e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} required autoFocus /></Stack></DialogContent><DialogActions><Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button><Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save category'}</Button></DialogActions></BoxForm></Dialog>
}

function BoxForm({ children, onSubmit }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit}>{children}</form> }

function StatusDialog({ category, onClose, onConfirm, isPending }: { category: Category | null; onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return <Dialog open={Boolean(category)} onClose={isPending ? undefined : onClose} fullWidth maxWidth="xs"><DialogTitle>{category?.isActive ? 'Deactivate category?' : 'Reactivate category?'}</DialogTitle><DialogContent><Alert severity={category?.isActive ? 'warning' : 'info'}>Deactivation preserves movement history. A category with active products cannot be deactivated.</Alert></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" color={category?.isActive ? 'warning' : 'success'} onClick={onConfirm} disabled={isPending}>{isPending ? 'Updating...' : category?.isActive ? 'Deactivate' : 'Reactivate'}</Button></DialogActions></Dialog>
}
