import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../Sidebar'

// Mock the auth context
const mockUseAuth = {
  user: null,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('../../authProvider', () => ({
  useAuth: () => mockUseAuth,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation links', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Patients')).toBeInTheDocument()
  })

  it('renders admin settings link when user is admin', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'admin' }

    render(<Sidebar />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('does not render admin settings link when user is not admin', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar />)

    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar />)

    const navElement = screen.getByRole('navigation')
    expect(navElement).toBeInTheDocument()
    expect(navElement).toHaveAttribute('aria-label', 'Main navigation')

    const menubarElement = screen.getByRole('menubar')
    expect(menubarElement).toBeInTheDocument()

    const menuItems = screen.getAllByRole('menuitem')
    expect(menuItems).toHaveLength(3) // Dashboard, Alerts, Patients
  })

  it('has proper ARIA labels for navigation links', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar />)

    const dashboardLink = screen.getByLabelText('Navigate to Dashboard')
    expect(dashboardLink).toBeInTheDocument()

    const alertsLink = screen.getByLabelText('Navigate to Alerts')
    expect(alertsLink).toBeInTheDocument()

    const patientsLink = screen.getByLabelText('Navigate to Patients')
    expect(patientsLink).toBeInTheDocument()
  })

  it('has proper ARIA label for admin settings link', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'admin' }

    render(<Sidebar />)

    const settingsLink = screen.getByLabelText('Navigate to Settings (Admin only)')
    expect(settingsLink).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar className="custom-class" />)

    const sidebarElement = screen.getByRole('navigation')
    expect(sidebarElement).toHaveClass('custom-class')
  })

  it('renders icons for navigation items', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'staff' }

    render(<Sidebar />)

    // Check that icons are rendered (they should be hidden from screen readers)
    const icons = screen.getAllByText(/[📊🚨👥]/)
    expect(icons.length).toBeGreaterThan(0)

    // Check that icons have aria-hidden attribute
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('renders admin icon when user is admin', () => {
    mockUseAuth.user = { id: '1', email: 'test@example.com', role: 'admin' }

    render(<Sidebar />)

    const adminIcon = screen.getByText('⚙️')
    expect(adminIcon).toBeInTheDocument()
    expect(adminIcon).toHaveAttribute('aria-hidden', 'true')
  })
}) 