import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Mock the stores
vi.mock('../../stores', () => ({
  initializeStores: vi.fn(),
}))

// Mock service provider
vi.mock('../../services/ServiceProvider', () => ({
  ServiceProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock all the page components
vi.mock('../../components/CommandCenter', () => ({
  CommandCenter: () => <div data-testid="command-center">Command Center Content</div>,
}))

vi.mock('../../components/Activities', () => ({
  Activities: () => <div data-testid="activities">Activities Content</div>,
}))

vi.mock('../../components/Cases', () => ({
  Cases: () => <div data-testid="cases">Cases Content</div>,
}))

vi.mock('../../components/CommunicationsPage', () => ({
  CommunicationsPage: ({ onBackToCommandCenter }: { onBackToCommandCenter: () => void }) => (
    <div data-testid="communications">
      Communications Content
      <button onClick={onBackToCommandCenter}>Back</button>
    </div>
  ),
}))

vi.mock('../../components/VisitorManagementDashboard', () => ({
  VisitorManagementDashboard: () => <div data-testid="visitors">Visitor Management Content</div>,
}))

vi.mock('../../components/ai/AIAssistantPanel', () => ({
  AIAssistantPanel: () => <div data-testid="ai-assistant">AI Assistant Panel</div>,
}))

describe('App Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the main application structure', () => {
    render(<App />)
    
    // Check header elements
    expect(screen.getByText('Situ8 Security Platform')).toBeInTheDocument()
    expect(screen.getByText('Real-time security management')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    
    // Check navigation elements
    expect(screen.getByText('Command Center')).toBeInTheDocument()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByText('Cases')).toBeInTheDocument()
    expect(screen.getByText('Communications')).toBeInTheDocument()
    expect(screen.getByText('Visitor Management')).toBeInTheDocument()
    
    // Check default module is loaded
    expect(screen.getByTestId('command-center')).toBeInTheDocument()
  })

  it('should render navigation with correct initial state', () => {
    render(<App />)
    
    // Check that Command Center is the active module
    const commandCenterButton = screen.getByRole('button', { name: /command center/i })
    expect(commandCenterButton).toHaveClass('bg-primary') // Active state styling
  })

  it('should switch modules when navigation buttons are clicked', async () => {
    render(<App />)
    
    // Initially should show Command Center
    expect(screen.getByTestId('command-center')).toBeInTheDocument()
    
    // Click on Activities
    await user.click(screen.getByRole('button', { name: /activities/i }))
    await waitFor(() => {
      expect(screen.getByTestId('activities')).toBeInTheDocument()
    })
    
    // Click on Cases
    await user.click(screen.getByRole('button', { name: /cases/i }))
    await waitFor(() => {
      expect(screen.getByTestId('cases')).toBeInTheDocument()
    })
    
    // Click on Communications
    await user.click(screen.getByRole('button', { name: /communications/i }))
    await waitFor(() => {
      expect(screen.getByTestId('communications')).toBeInTheDocument()
    })
    
    // Click on Visitor Management
    await user.click(screen.getByRole('button', { name: /visitor management/i }))
    await waitFor(() => {
      expect(screen.getByTestId('visitors')).toBeInTheDocument()
    })
  })

  it('should toggle sidebar collapse', async () => {
    render(<App />)
    
    // Initially sidebar should be expanded (showing text)
    expect(screen.getByText('Command Center')).toBeInTheDocument()
    expect(screen.getByText('Quick Stats')).toBeInTheDocument()
    
    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(collapseButton)
    
    await waitFor(() => {
      // After collapse, detailed text should not be visible but icons should be
      expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument()
      // Expand button should now be available
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
    })
  })

  it('should show unimplemented module message for disabled modules', async () => {
    render(<App />)
    
    // Try to click on a disabled module (Analytics)
    const analyticsButton = screen.getByRole('button', { name: /analytics/i })
    expect(analyticsButton).toBeDisabled()
    
    // Should show "Soon" badge
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })

  it('should display current time in header', () => {
    render(<App />)
    
    // Should show time (format: HH:MM)
    const timeRegex = /\\d{1,2}:\\d{2}/
    expect(screen.getByText(timeRegex)).toBeInTheDocument()
  })

  it('should display quick stats in sidebar', () => {
    render(<App />)
    
    expect(screen.getByText('Active Incidents')).toBeInTheDocument()
    expect(screen.getByText('Guards on Duty')).toBeInTheDocument()
    expect(screen.getByText("Today's Activities")).toBeInTheDocument()
    
    // Check the badge values
    expect(screen.getByText('3')).toBeInTheDocument() // Active Incidents
    expect(screen.getByText('12')).toBeInTheDocument() // Guards on Duty
    expect(screen.getByText('47')).toBeInTheDocument() // Today's Activities
  })

  it('should render AI Assistant Panel', () => {
    render(<App />)
    
    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument()
  })

  it('should handle communications page back navigation', async () => {
    render(<App />)
    
    // Navigate to communications
    await user.click(screen.getByRole('button', { name: /communications/i }))
    await waitFor(() => {
      expect(screen.getByTestId('communications')).toBeInTheDocument()
    })
    
    // Click the back button in communications page
    await user.click(screen.getByRole('button', { name: /back/i }))
    await waitFor(() => {
      expect(screen.getByTestId('command-center')).toBeInTheDocument()
    })
  })

  it('should apply dark mode class', () => {
    render(<App />)
    
    // Check that the app container has dark class
    const appContainer = screen.getByText('Situ8 Security Platform').closest('.dark')
    expect(appContainer).toBeInTheDocument()
  })

  it('should show correct user role badge', () => {
    render(<App />)
    
    // Should show Admin badge by default
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should handle tooltip interactions in collapsed sidebar', async () => {
    render(<App />)
    
    // Collapse sidebar first
    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(collapseButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
    })
    
    // In collapsed state, navigation items should have tooltips
    const commandCenterIcon = screen.getByRole('button', { name: /command center/i })
    expect(commandCenterIcon).toBeInTheDocument()
  })
})