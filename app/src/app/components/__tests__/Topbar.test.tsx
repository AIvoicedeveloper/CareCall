import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TopbarComponent from '../Topbar'
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

describe('Topbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header with title', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    expect(screen.getByText('CareCall Dashboard')).toBeInTheDocument()
  })

  it('renders user email when user is authenticated', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument()
  })

  it('renders sign out button when user is authenticated', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    expect(signOutButton).toBeInTheDocument()
  })

  it('does not render sign out button when user is not authenticated', () => {
    mockUseAuth.user = null

    render(<TopbarComponent />)

    expect(screen.queryByRole('button', { name: 'Sign out of the application' })).not.toBeInTheDocument()
  })

  it('calls signOut when sign out button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    await user.click(signOutButton)

    expect(mockUseAuth.signOut).toHaveBeenCalledTimes(1)
  })

  it('handles keyboard navigation for sign out button', async () => {
    const user = userEvent.setup()
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    
    // Test Enter key
    await user.keyboard('{Tab}')
    await user.keyboard('{Enter}')
    expect(mockUseAuth.signOut).toHaveBeenCalledTimes(1)

    // Reset mock
    jest.clearAllMocks()

    // Test Space key
    await user.keyboard(' ')
    expect(mockUseAuth.signOut).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const headerElement = screen.getByRole('banner')
    expect(headerElement).toBeInTheDocument()
    expect(headerElement).toHaveAttribute('aria-label', 'Application header')

    const userSpan = screen.getByLabelText('Current user: test@example.com')
    expect(userSpan).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent className="custom-class" />)

    const headerElement = screen.getByRole('banner')
    expect(headerElement).toHaveClass('custom-class')
  })

  it('handles sign out errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUseAuth.signOut.mockRejectedValue(new Error('Sign out failed'))
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    await userEvent.click(signOutButton)

    expect(consoleSpy).toHaveBeenCalledWith('Sign out failed:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('has proper focus styles', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    expect(signOutButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  it('has proper tab index for keyboard navigation', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<TopbarComponent />)

    const signOutButton = screen.getByRole('button', { name: 'Sign out of the application' })
    expect(signOutButton).toHaveAttribute('tabIndex', '0')
  })

  it('displays user role with appropriate styling', () => {
    mockUseAuth.user = { id: '1', email: 'admin@example.com', role: 'admin' };
    mockUseAuth.loading = false;

    renderWithAuth(<TopbarComponent />);

    const roleElement = screen.getByText('admin');
    expect(roleElement).toBeInTheDocument();
    expect(roleElement).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays different role styling for different roles', () => {
    mockUseAuth.user = { id: '1', email: 'doctor@example.com', role: 'doctor' };
    mockUseAuth.loading = false;

    renderWithAuth(<TopbarComponent />);

    const roleElement = screen.getByText('doctor');
    expect(roleElement).toBeInTheDocument();
    expect(roleElement).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('displays role icon', () => {
    mockUseAuth.user = { id: '1', email: 'staff@example.com', role: 'staff' };
    mockUseAuth.loading = false;

    renderWithAuth(<TopbarComponent />);

    // Check for the staff icon (👥)
    const iconElement = screen.getByText('👥');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute('aria-hidden', 'true');
  });
}) 