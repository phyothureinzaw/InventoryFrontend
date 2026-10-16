import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { ApiError } from '../../api/client'
import { getProblemMessage, useAuth } from '../auth/AuthProvider'

const passwordRequirements = 'At least 12 characters with uppercase, lowercase, a number, and a special character.'

function validPassword(password: string) {
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

export default function UsersPage() {
  const { request } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (displayName.trim().length < 2) return setError('Enter a display name with at least 2 characters.')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (!validPassword(password)) return setError(passwordRequirements)
    if (password !== confirmation) return setError('Passwords do not match.')

    setIsSubmitting(true)
    try {
      await request('/api/users', { method: 'POST', body: JSON.stringify({ displayName: displayName.trim(), email: email.trim(), password }) })
      setSuccess('Staff account created successfully.')
      setDisplayName('')
      setEmail('')
      setPassword('')
      setConfirmation('')
    } catch (submissionError) {
      setError(submissionError instanceof ApiError && submissionError.status === 409 ? 'An account with that email already exists.' : getProblemMessage(submissionError, 'Unable to create the Staff account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return <Stack spacing={3} sx={{ maxWidth: 760 }}><Box><Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>Administration</Typography><Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3rem' } }}>Users</Typography><Typography color="text.secondary">Create Staff accounts for your inventory workspace.</Typography></Box><Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}><Stack spacing={2.5}><Typography variant="h6" sx={{ fontWeight: 700 }}>Create Staff account</Typography>{error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}<TextField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={isSubmitting} autoComplete="name" required /><TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} autoComplete="email" required /><TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} autoComplete="new-password" helperText={passwordRequirements} required /><TextField label="Confirm password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isSubmitting} autoComplete="new-password" required /><Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Staff account'}</Button></Stack></Paper><Typography variant="body2" color="text.secondary">There is no user list endpoint in this checkpoint, so this page does not display invented or cached user records.</Typography></Stack>
}
