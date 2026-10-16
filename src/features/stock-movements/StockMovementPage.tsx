/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Autocomplete, Box, Button, Divider, FormHelperText, Paper, Stack, TextField, Typography } from '@mui/material'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useAuth } from '../auth/AuthProvider'
import { getProduct, getProducts, getSupplier, getSuppliers, type Product, type Supplier } from '../master-data/api'
import { StockChip } from '../master-data/status'
import { Pagination, PageHeading } from '../master-data/components'
import { useDebouncedValue } from '../master-data/hooks'
import { isUncertainStockError, stockError, stockIn, stockOut } from './api'
import { createRequestSnapshot, nextRequestId, shouldAutoRetry } from './requestLifecycle'
import type { StockMovementResponse } from './types'
import { validateStockOutQuantity } from './validation'

type Mode = 'in' | 'out'
type FormState = { productId: string; quantity: string; supplierId: string; reason: string; referenceNumber: string; notes: string }
type Submission = Readonly<{ requestId: string; payload: Readonly<Record<string, unknown>> }>

const blank: FormState = { productId: '', quantity: '', supplierId: '', reason: '', referenceNumber: '', notes: '' }

export default function StockMovementPage({ mode }: { mode: Mode }) {
  const { request } = useAuth(); const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(blank); const [productSearch, setProductSearch] = useState(''); const [productPage, setProductPage] = useState(1); const [supplierSearch, setSupplierSearch] = useState(''); const [supplierPage, setSupplierPage] = useState(1)
  const [requestId, setRequestId] = useState(nextRequestId); const [pending, setPending] = useState<Submission | null>(null); const [result, setResult] = useState<StockMovementResponse | null>(null); const [definiteError, setDefiniteError] = useState('')
  const debouncedProductSearch = useDebouncedValue(productSearch); const debouncedSupplierSearch = useDebouncedValue(supplierSearch)
  useEffect(() => setProductPage(1), [debouncedProductSearch]); useEffect(() => setSupplierPage(1), [debouncedSupplierSearch])
  const products = useQuery({ queryKey: ['products', 'selector', { search: debouncedProductSearch, page: productPage, pageSize: 20 }], queryFn: () => getProducts(request, { search: debouncedProductSearch, categoryId: '', isActive: 'true', stockStatus: 'all', page: productPage, pageSize: 20 }) })
  const suppliers = useQuery({ queryKey: ['suppliers', 'selector', { search: debouncedSupplierSearch, page: supplierPage, pageSize: 20 }], queryFn: () => getSuppliers(request, { search: debouncedSupplierSearch, isActive: 'true', page: supplierPage, pageSize: 20 }), enabled: mode === 'in' })
  const selectedProduct = useQuery({ queryKey: ['product', form.productId], queryFn: () => getProduct(request, form.productId), enabled: Boolean(form.productId) })
  const selectedSupplierDetail = useQuery({ queryKey: ['supplier', form.supplierId], queryFn: () => getSupplier(request, form.supplierId), enabled: mode === 'in' && Boolean(form.supplierId) })
  const product = selectedProduct.data ?? products.data?.items.find(item => item.id === form.productId) ?? null
  const selectedSupplier = selectedSupplierDetail.data ?? suppliers.data?.items.find(item => item.id === form.supplierId) ?? null
  const snapshot = pending ? pending : null
  const mutation = useMutation({ mutationFn: (attempt: Submission) => mode === 'in' ? stockIn(request, attempt.payload as never) : stockOut(request, attempt.payload as never), retry: shouldAutoRetry(), onSuccess: response => { setPending(null); setResult(response); setDefiniteError(''); setRequestId(nextRequestId()); void invalidateAfterMovement(queryClient, response.productId) }, onError: (error, attempt) => { if (isUncertainStockError(error)) setPending(attempt); else { setPending(null); setDefiniteError(stockError(error, 'The stock operation was rejected.')); setRequestId(nextRequestId()) } } })
  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm(current => ({ ...current, [field]: event.target.value })); setDefiniteError(''); setResult(null) }
  const quantity = Number(form.quantity); const quantityValid = Number.isInteger(quantity) && quantity > 0; const insufficientWarning = mode === 'out' && product !== null && quantityValid && quantity > product.availableStock
  const validation = !form.productId ? 'Choose an active product.' : mode === 'out' ? validateStockOutQuantity(quantity, product?.availableStock ?? Number.MAX_SAFE_INTEGER, form.reason) || undefined : !quantityValid ? 'Quantity must be a positive whole number.' : undefined
  const submit = (event: FormEvent) => { event.preventDefault(); if (pending || validation) return; const payload = mode === 'in' ? { productId: form.productId, quantity, supplierId: form.supplierId || null, referenceNumber: form.referenceNumber.trim() || null, notes: form.notes.trim() || null, requestId } : { productId: form.productId, quantity, reason: form.reason.trim(), referenceNumber: form.referenceNumber.trim() || null, notes: form.notes.trim() || null, requestId }; const attempt = createRequestSnapshot(payload, requestId) as Submission; setPending(attempt); setDefiniteError(''); mutation.mutate(attempt) }
  const retry = () => { if (snapshot) mutation.mutate(snapshot) }
  const title = mode === 'in' ? 'Stock In' : 'Stock Out'; const Icon = mode === 'in' ? ArrowDownwardRoundedIcon : ArrowUpwardRoundedIcon
  return <Stack spacing={3}><PageHeading eyebrow="Inventory / Operations" title={title} description={mode === 'in' ? 'Record received stock with a safe, retryable submission.' : 'Record an issue or adjustment while keeping the server authoritative for balance.'} action={<Icon color="primary" sx={{ fontSize: 54 }} />} />
    {pending && <Alert severity="warning" action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={retry} disabled={mutation.isPending}>{mutation.isPending ? 'Retrying...' : 'Retry same operation'}</Button>}>The outcome is uncertain. Keep this exact request ID and payload until it is resolved. Starting another operation first could record a duplicate.</Alert>}
    {definiteError && <Alert severity="error">{definiteError}</Alert>}
    {mutation.isError && pending && <Alert severity="warning">{stockError(mutation.error, 'The server outcome could not be confirmed.')} Retry uses the same request ID and payload.</Alert>}
    {result && <MovementResult result={result} product={product} />}
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 850 }}><Stack spacing={2.5}><Typography variant="h6" sx={{ fontWeight: 800 }}>Movement details</Typography><ProductSelector products={products.data?.items ?? []} product={product} search={productSearch} onSearch={setProductSearch} page={productPage} totalCount={products.data?.totalCount ?? 0} onPage={setProductPage} value={form.productId} onChange={id => setForm(current => ({ ...current, productId: id }))} loading={products.isPending} />{product && <SelectedProduct product={product} />}<SelectorError error={products.isError ? 'Unable to load products.' : undefined} />
      {mode === 'in' && <SupplierSelector suppliers={suppliers.data?.items ?? []} supplier={selectedSupplier} search={supplierSearch} onSearch={setSupplierSearch} page={supplierPage} totalCount={suppliers.data?.totalCount ?? 0} onPage={setSupplierPage} onChange={id => setForm(current => ({ ...current, supplierId: id }))} loading={suppliers.isPending} />}
      <TextField label="Quantity" type="number" value={form.quantity} onChange={set('quantity')} slotProps={{ htmlInput: { min: 1, step: 1 } }} required error={Boolean(form.quantity) && !quantityValid} helperText="Enter a positive whole number." />
      {mode === 'out' && <TextField label="Reason" value={form.reason} onChange={set('reason')} required multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} helperText="Explain why the stock is leaving inventory." />}
       {mode === 'out' && product && <Alert severity={insufficientWarning ? 'warning' : 'info'}>Available stock: <strong>{product.availableStock} {product.unit}</strong> (physical {product.currentStock}, reserved {product.reservedStock}). {insufficientWarning ? 'The entered quantity exceeds this displayed balance.' : 'Displayed stock may change before submission; the server remains authoritative.'}</Alert>}
      <TextField label="Reference number" value={form.referenceNumber} onChange={set('referenceNumber')} slotProps={{ htmlInput: { maxLength: 100 } }} helperText="Optional purchase order, sales order, or internal reference." /><TextField label="Notes" value={form.notes} onChange={set('notes')} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 2000 } }} />
      <Divider /><Summary mode={mode} product={product} supplier={selectedSupplier} form={form} quantity={quantity} /><Button type="submit" variant="contained" size="large" disabled={Boolean(pending) || mutation.isPending || Boolean(validation)} startIcon={<Icon />}>{mutation.isPending ? 'Submitting...' : `Submit ${title.toLowerCase()}`}</Button></Stack></Paper>
  </Stack>
}

function ProductSelector({ products, product, search, onSearch, page, totalCount, onPage, value, onChange, loading }: { products: Product[]; product: Product | null; search: string; onSearch: (value: string) => void; page: number; totalCount: number; onPage: (page: number) => void; value: string; onChange: (id: string) => void; loading: boolean }) {
  return <Box><Autocomplete options={products} value={product} loading={loading} isOptionEqualToValue={(option, selected) => option.id === selected.id} getOptionLabel={option => `${option.sku} · ${option.name}`} onChange={(_, next) => onChange(next?.id ?? '')} inputValue={search} onInputChange={(_, next, reason) => reason !== 'reset' && onSearch(next)} renderInput={params => <TextField {...params} label="Active product" required={!value} placeholder="Search SKU or name" helperText="Searches active products on the server." />} renderOption={(props, option) => <li {...props} key={option.id}><Stack><Typography sx={{ fontWeight: 700 }}>{option.sku} · {option.name}</Typography><Typography variant="caption" color="text.secondary">{option.currentStock} {option.unit} · {option.isOutOfStock ? 'Out of stock' : option.isLowStock ? 'Low stock' : 'Healthy stock'}</Typography></Stack></li>} /><Pagination page={page} pageSize={20} totalCount={totalCount} onPageChange={onPage} /></Box>
}

function SupplierSelector({ suppliers, supplier, search, onSearch, page, totalCount, onPage, onChange, loading }: { suppliers: Supplier[]; supplier: Supplier | null; search: string; onSearch: (value: string) => void; page: number; totalCount: number; onPage: (page: number) => void; onChange: (id: string) => void; loading: boolean }) {
  return <Box><Autocomplete options={suppliers} value={supplier} loading={loading} isOptionEqualToValue={(option, selected) => option.id === selected.id} getOptionLabel={option => option.name} onChange={(_, next) => onChange(next?.id ?? '')} inputValue={search} onInputChange={(_, next, reason) => reason !== 'reset' && onSearch(next)} renderInput={params => <TextField {...params} label="Supplier (optional)" placeholder="Search active suppliers" helperText="Optional. Search and page through the active supplier list." />} /><Pagination page={page} pageSize={20} totalCount={totalCount} onPageChange={onPage} /></Box>
}

function SelectorError({ error }: { error?: string }) { return error ? <FormHelperText error>{error}</FormHelperText> : null }
function SelectedProduct({ product }: { product: Product }) { return <Paper variant="outlined" sx={{ p: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}><Box><Typography sx={{ fontWeight: 800 }}>{product.name}</Typography><Typography variant="body2" color="text.secondary">{product.sku} · unit: {product.unit} · current stock: {product.currentStock}</Typography></Box><StockChip product={product} /></Stack></Paper> }
function Summary({ mode, product, supplier, form, quantity }: { mode: Mode; product: Product | null; supplier: Supplier | null; form: FormState; quantity: number }) { return <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Submission summary</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{mode === 'in' ? 'Receive' : 'Issue'} <strong>{quantity > 0 ? quantity : '...'}</strong> {product?.unit ?? 'units'} {product ? `of ${product.name} (${product.sku})` : 'for the selected product'}{mode === 'in' && supplier ? ` from ${supplier.name}` : ''}{mode === 'out' && form.reason.trim() ? ` for ${form.reason.trim()}` : ''}.</Typography></Paper> }
function MovementResult({ result, product }: { result: StockMovementResponse; product: Product | null }) { return <Alert severity="success"><Typography sx={{ fontWeight: 800 }}>Stock movement recorded</Typography><Typography variant="body2">Movement {result.id} · {result.quantity} {product?.unit ?? 'units'} · stock {result.stockBefore} → {result.stockAfter} · {new Date(result.occurredAtUtc).toLocaleString()}</Typography></Alert> }
async function invalidateAfterMovement(queryClient: ReturnType<typeof useQueryClient>, productId: string) { await Promise.all([queryClient.invalidateQueries({ queryKey: ['products'] }), queryClient.invalidateQueries({ queryKey: ['product', productId] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['movements'] })]) }
