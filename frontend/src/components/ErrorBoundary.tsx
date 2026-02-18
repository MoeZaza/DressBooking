import React, { Component, ErrorInfo, ReactNode, PropsWithChildren } from 'react'
import { Typography, Button, Box, Container } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state
    this.setState({
      hasError: true,
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    const { fallback, children } = this.props

    if (this.state.hasError) {
      // Render fallback UI when error occurs
      return fallback || (
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {commonStrings.SOMETHING_WENT_WRONG || 'Something went wrong'}
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            {this.state.error?.message || commonStrings.UNKNOWN_ERROR || 'An unknown error occurred'}
          </Typography>
          {this.state.errorInfo && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Component: {this.state.errorInfo.componentStack || 'Unknown'}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Reset error state
              this.setState({ hasError: false, error: null, errorInfo: null })
              // Reload page to recover
              window.location.reload()
            }}
            sx={{ mt: 2 }}
          >
            {commonStrings.TRY_AGAIN || 'Try Again'}
          </Button>
        </Container>
      )
    }

    // Render children normally when no error
    return children
  }
}

export default ErrorBoundary
