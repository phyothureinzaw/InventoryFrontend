import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { useLocation, useNavigate } from 'react-router-dom'
import { getProblemMessage, useAuth } from './AuthProvider'

type LocationState = { from?: { pathname?: string; search?: string; hash?: string } }

function safeReturnPath(state: unknown): string {
  const from = (state as LocationState | null)?.from
  const pathname = from?.pathname
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) return '/'
  return `${pathname}${from.search ?? ''}${from.hash ?? ''}`
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const emailIsValid = email.includes('@') && email.includes('.')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)
    if (!email.trim() || !emailIsValid || !password) {
      setError('Enter your email and password.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate(safeReturnPath(location.state), { replace: true })
    } catch (submissionError) {
      setError(getProblemMessage(submissionError, 'Unable to sign in. Try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 5, background: 'linear-gradient(135deg, #eef4ff 0%, #f7f9fc 55%, #e8edf6 100%)' }}>
    <Paper component="main" elevation={0} sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 }, border: '1px solid #e0e7f0' }}>
      <Stack spacing={3} component="form" onSubmit={submit}>
        <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center' }}><Inventory2OutlinedIcon color="primary" sx={{ fontSize: 36 }} /><Typography variant="h4" sx={{ fontWeight: 800 }}>Welcome back</Typography><Typography color="text.secondary">Sign in to your inventory workspace.</Typography></Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} fullWidth error={hasSubmitted && (!email.trim() || !emailIsValid)} helperText={hasSubmitted && !email.trim() ? 'Email is required.' : hasSubmitted && !emailIsValid ? 'Enter a valid email address.' : undefined} />
        <TextField label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} fullWidth error={hasSubmitted && !password} helperText={hasSubmitted && !password ? 'Password is required.' : undefined} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} edge="end"><>{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</></IconButton></InputAdornment> } }} />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ py: 1.4 }}>{isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}</Button>
      </Stack>
    </Paper>
  </Box>
}
