import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="normal-content">Normal content</div>
      </ErrorBoundary>
    )

    expect(screen.getByTestId('normal-content')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
  })

  it('shows different error messages based on errorType', () => {
    render(
      <ErrorBoundary errorType="auth">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Authentication error occurred')).toBeInTheDocument()
  })

  it('shows data error message for data errorType', () => {
    render(
      <ErrorBoundary errorType="data">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Data loading error occurred')).toBeInTheDocument()
  })

  it('shows UI error message for ui errorType', () => {
    render(
      <ErrorBoundary errorType="ui">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Interface error occurred')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const alertElement = screen.getByRole('alert')
    expect(alertElement).toBeInTheDocument()
    expect(alertElement).toHaveAttribute('aria-live', 'assertive')
    expect(alertElement).toHaveAttribute('aria-label', 'Application error')
  })

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('does not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('calls retry function when Try Again button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: 'Retry the operation' })
    fireEvent.click(retryButton)

    // The error boundary should reset and show the normal content
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('reloads page when Reload Page button is clicked', () => {
    const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: 'Reload the page' })
    fireEvent.click(reloadButton)

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  it('logs production errors to console', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalledWith('Production error:', expect.objectContaining({
      message: 'Test error',
      errorType: 'general'
    }))

    consoleSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })
}) 