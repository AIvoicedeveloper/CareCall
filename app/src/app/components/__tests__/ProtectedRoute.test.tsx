import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProtectedRoute from '../ProtectedRoute'
import { AuthProvider } from '../../authProvider'

// Mock the auth context
const mockUseAuth = {
  user: null,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('../../authProvider', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }
    mockUseAuth.loading = false

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('shows loading state when auth is loading', () => {
    mockUseAuth.user = null
    mockUseAuth.loading = true

    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByText('Checking authentication...')).toBeInTheDocument()
  })

  it('shows access denied when user is not authenticated', () => {
    mockUseAuth.user = null
    mockUseAuth.loading = false

    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to continue')).toBeInTheDocument()
  })

  it('shows access denied when user role does not match required role', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }
    mockUseAuth.loading = false

    renderWithAuth(
      <ProtectedRoute requiredRole="admin">
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText("You don't have permission to access this page")).toBeInTheDocument()
  })

  it('renders children when user role matches required role', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'admin' }
    mockUseAuth.loading = false

    renderWithAuth(
      <ProtectedRoute requiredRole="admin">
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    mockUseAuth.user = null
    mockUseAuth.loading = false

    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    const alertElement = screen.getByRole('alert')
    expect(alertElement).toBeInTheDocument()
    expect(alertElement).toHaveAttribute('aria-live', 'assertive')
    expect(alertElement).toHaveAttribute('aria-label', 'Access denied')
  })

  it('has proper accessibility attributes for loading state', () => {
    mockUseAuth.user = null
    mockUseAuth.loading = true

    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    const statusElement = screen.getByRole('status')
    expect(statusElement).toBeInTheDocument()
    expect(statusElement).toHaveAttribute('aria-live', 'polite')
    expect(statusElement).toHaveAttribute('aria-label', 'Authentication status')
  })
}) 