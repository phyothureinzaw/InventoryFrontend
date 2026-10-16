/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Autocomplete, Box, Button, Divider, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { useAuth, getProblemMessage } from '../auth/AuthProvider'
import { getProducts, getProduct, getSupplier, getSuppliers, type Product, type Supplier } from '../master-data/api'
import { Pagination, PageHeading } from '../master-data/components'
import { useDebouncedValue } from '../master-data/hooks'
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrder } from './api'

type LineDraft = { key: string; productId: string; quantity: string }
const newLine = (): LineDraft => ({ key: crypto.randomUUID(), productId: '', quantity: '' })

export default function PurchaseOrderEditorPage() {
  const { request } = useAuth(); const navigate = useNavigate(); const queryClient = useQueryClient(); const { id } = useParams()
  const editing = Boolean(id)
  const [supplierId, setSupplierId] = useState(''); const [supplierSearch, setSupplierSearch] = useState(''); const debouncedSupplierSearch = useDebouncedValue(supplierSearch); const [supplierPage, setSupplierPage] = useState(1); const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [productSearch, setProductSearch] = useState(''); const debouncedProductSearch = useDebouncedValue(productSearch); const [productPage, setProductPage] = useState(1)
  const [lines, setLines] = useState<LineDraft[]>([newLine()]); const [initialized, setInitialized] = useState(!editing); const [error, setError] = useState('')
  const order = useQuery({ queryKey: ['purchase-order', id], queryFn: () => getPurchaseOrder(request, id!), enabled: editing })
  const suppliers = useQuery({ queryKey: ['suppliers', 'purchase-order-editor', { search: debouncedSupplierSearch, page: supplierPage }], queryFn: () => getSuppliers(request, { search: debouncedSupplierSearch, isActive: 'true', page: supplierPage, pageSize: 20 }) })
  const products = useQuery({ queryKey: ['products', 'purchase-order-editor', { search: debouncedProductSearch, page: productPage }], queryFn: () => getProducts(request, { search: debouncedProductSearch, categoryId: '', isActive: 'true', stockStatus: 'all', page: productPage, pageSize: 20 }) })
  const selectedSupplierQuery = useQuery({ queryKey: ['supplier', supplierId], queryFn: () => getSupplier(request, supplierId), enabled: Boolean(supplierId) })
  useEffect(() => { setSupplierPage(1) }, [debouncedSupplierSearch]); useEffect(() => { setProductPage(1) }, [debouncedProductSearch])
  useEffect(() => {
    if (order.data && !initialized) {
      setSupplierId(order.data.supplierId); setSelectedSupplier({ id: order.data.supplierId, name: order.data.supplierName, isActive: order.data.supplierIsActive } as Supplier)
      setLines(order.data.lines.map(line => ({ key: line.id, productId: line.productId, quantity: String(line.orderedQuantity) }))); setInitialized(true)
    }
  }, [order.data, initialized])
  const supplier = selectedSupplier ?? selectedSupplierQuery.data ?? suppliers.data?.items.find(item => item.id === supplierId) ?? null
  const selectedProductQueries = useQueries({ queries: lines.map(line => ({ queryKey: ['product', line.productId], queryFn: () => getProduct(request, line.productId), enabled: Boolean(line.productId) })) })
  const productById = new Map<string, Product>((products.data?.items ?? []).map(product => [product.id, product])); selectedProductQueries.forEach(query => { if (query.data) productById.set(query.data.id, query.data) })
  const duplicateProducts = new Set(lines.filter(line => line.productId).map(line => line.productId)).size !== lines.filter(line => line.productId).length
  const validLines = lines.length > 0 && lines.every(line => line.productId && Number.isInteger(Number(line.quantity)) && Number(line.quantity) > 0)
  const validation = !supplierId ? 'Choose an active supplier.' : !validLines ? 'Add at least one product with a positive whole-number quantity.' : duplicateProducts ? 'Each product may appear only once.' : ''
  const mutation = useMutation({ mutationFn: (body: { supplierId: string; lines: { productId: string; orderedQuantity: number }[]; rowVersion?: string }) => editing ? updatePurchaseOrder(request, id!, body as never) : createPurchaseOrder(request, body), retry: false, onSuccess: async response => { await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); await queryClient.setQueryData(['purchase-order', response.id], response); navigate(`/purchase-orders/${response.id}`) }, onError: (reason: unknown) => setError(getProblemMessage(reason, 'The purchase order could not be saved. Review the form and try again.')) })
  const updateLine = (key: string, patch: Partial<LineDraft>) => { setLines(current => current.map(line => line.key === key ? { ...line, ...patch } : line)); setError('') }
  const submit = (event: FormEvent) => { event.preventDefault(); if (validation || mutation.isPending || !supplierId) return; const body = { supplierId, lines: lines.map(line => ({ productId: line.productId, orderedQuantity: Number(line.quantity) })) }; mutation.mutate(editing ? { ...body, rowVersion: order.data!.rowVersion } : body) }
  if (editing && order.isPending) return <Typography color="text.secondary">Loading draft...</Typography>
  if (editing && (order.isError || !order.data)) return <Alert severity="error">Unable to load this purchase order. <Button onClick={() => order.refetch()}>Retry</Button></Alert>
  if (editing && order.data?.status !== 'Draft') return <Alert severity="warning">Only Draft purchase orders can be edited. <Button onClick={() => navigate(`/purchase-orders/${id}`)}>View order</Button></Alert>
  return <Stack spacing={3}><PageHeading eyebrow="Procurement / Draft" title={editing ? 'Edit purchase order' : 'Create purchase order'} description="Choose active master data and quantities. Prices and stock balances are not part of a purchase order." action={<Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(editing ? `/purchase-orders/${id}` : '/purchase-orders')}>Back</Button>} />
    {error && <Alert severity="error">{error}{error.toLowerCase().includes('changed') && <Button color="inherit" onClick={() => order.refetch()}>Reload order</Button>}</Alert>}
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 980 }}><Stack spacing={2.5}><SupplierSelector suppliers={suppliers.data?.items ?? []} supplier={supplier} search={supplierSearch} onSearch={setSupplierSearch} page={supplierPage} totalCount={suppliers.data?.totalCount ?? 0} onPage={setSupplierPage} onChange={next => { setSupplierId(next?.id ?? ''); setSelectedSupplier(next) }} loading={suppliers.isPending} />
      <Divider /><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1 }}><Box><Typography variant="h6" sx={{ fontWeight: 800 }}>Order lines</Typography><Typography variant="body2" color="text.secondary">Products must be active and cannot be repeated.</Typography></Box><Button startIcon={<AddRoundedIcon />} onClick={() => setLines(current => [...current, newLine()])}>Add line</Button></Stack>
      {lines.map((line, index) => <LineEditor key={line.key} index={index} line={line} product={productById.get(line.productId) ?? null} products={products.data?.items ?? []} productSearch={productSearch} onProductSearch={setProductSearch} productPage={productPage} productTotal={products.data?.totalCount ?? 0} onProductPage={setProductPage} onChange={patch => updateLine(line.key, patch)} onRemove={() => setLines(current => current.length === 1 ? current : current.filter(item => item.key !== line.key))} />)}
      {validation && <Alert severity="info">{validation}</Alert>}<Button type="submit" variant="contained" size="large" disabled={Boolean(validation) || mutation.isPending || !initialized} startIcon={<SaveRoundedIcon />}>{mutation.isPending ? 'Saving...' : editing ? 'Save draft' : 'Create draft'}</Button>
    </Stack></Paper></Stack>
}

function SupplierSelector({ suppliers, supplier, search, onSearch, page, totalCount, onPage, onChange, loading }: { suppliers: Supplier[]; supplier: Supplier | null; search: string; onSearch: (value: string) => void; page: number; totalCount: number; onPage: (page: number) => void; onChange: (supplier: Supplier | null) => void; loading: boolean }) {
  return <Box><Autocomplete options={suppliers} value={supplier} loading={loading} isOptionEqualToValue={(option, value) => option.id === value.id} getOptionLabel={option => option.name} inputValue={search} onInputChange={(_, next, reason) => reason !== 'reset' && onSearch(next)} onChange={(_, next) => onChange(next)} renderInput={params => <TextField {...params} label="Active supplier" required helperText="Searches active suppliers on the server." />} />{totalCount > 20 && <Pagination page={page} pageSize={20} totalCount={totalCount} onPageChange={onPage} />}</Box>
}

function LineEditor({ index, line, product, products, productSearch, onProductSearch, productPage, productTotal, onProductPage, onChange, onRemove }: { index: number; line: LineDraft; product: Product | null; products: Product[]; productSearch: string; onProductSearch: (value: string) => void; productPage: number; productTotal: number; onProductPage: (page: number) => void; onChange: (patch: Partial<LineDraft>) => void; onRemove: () => void }) {
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'flex-start' } }}><Box sx={{ flex: 1, width: '100%' }}><Autocomplete options={products} value={product} isOptionEqualToValue={(option, value) => option.id === value.id} getOptionLabel={option => `${option.sku} · ${option.name}`} inputValue={productSearch} onInputChange={(_, next, reason) => reason !== 'reset' && onProductSearch(next)} onChange={(_, next) => onChange({ productId: next?.id ?? '' })} renderInput={params => <TextField {...params} label={`Product ${index + 1}`} required helperText={product ? `${product.unit} · active` : 'Search active products'} />} />{productTotal > 20 && <Pagination page={productPage} pageSize={20} totalCount={productTotal} onPageChange={onProductPage} />}</Box><TextField label="Ordered quantity" type="number" value={line.quantity} onChange={event => onChange({ quantity: event.target.value })} required sx={{ width: { xs: '100%', md: 190 } }} slotProps={{ htmlInput: { min: 1, step: 1 } }} helperText={product ? `Unit: ${product.unit}` : 'Positive whole number'} /><IconButton aria-label={`Remove line ${index + 1}`} onClick={onRemove} disabled={index === 0} sx={{ mt: { md: 1 } }}><DeleteOutlineRoundedIcon /></IconButton></Stack></Paper>
}
