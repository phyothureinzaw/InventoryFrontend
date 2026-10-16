import type { CSSProperties } from 'react'

declare module '@mui/material/Stack' {
  interface StackOwnProps {
    alignItems?: CSSProperties['alignItems']
  }
}
