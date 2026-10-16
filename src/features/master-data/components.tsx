import { Alert, Box, Button, CircularProgress, Paper, Stack, TablePagination, Typography } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import type { ReactNode } from 'react'

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, gap: 2 }}>
    <Box><Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>{eyebrow}</Typography><Typography variant="h3" sx={{ fontWeight: 850, letterSpacing: '-0.04em', fontSize: { xs: '2.15rem', md: '3rem' } }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }}>{description}</Typography></Box>{action}
  </Stack>
}

export function QueryState({ isLoading, isError, onRetry, children, empty, filtered }: { isLoading: boolean; isError: boolean; onRetry: () => void; children: ReactNode; empty: ReactNode; filtered: boolean }) {
  if (isLoading) return <Paper sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Loading" /></Paper>
  if (isError) return <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={onRetry}>Retry</Button>}>Unable to load this data.</Alert>
  return children ?? (filtered ? <EmptyState title="No matches" body="Try changing your search or filters." /> : empty)
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <Paper variant="outlined" sx={{ p: { xs: 4, sm: 7 }, textAlign: 'center', borderStyle: 'dashed', bgcolor: 'transparent' }}><Typography variant="h6" sx={{ fontWeight: 750 }}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{body}</Typography></Paper>
}

export function Pagination({ page, pageSize, totalCount, onPageChange }: { page: number; pageSize: number; totalCount: number; onPageChange: (page: number) => void }) {
  return <TablePagination component="div" count={totalCount} page={page - 1} onPageChange={(_, next) => onPageChange(next + 1)} rowsPerPage={pageSize} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`} />
}
