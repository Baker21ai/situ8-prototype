import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Activities } from '../../components/Activities'

// Mock the stores
vi.mock('../../stores', () => ({
  useActivityStore: () => ({
    getActivityStats: vi.fn(() => ({
      total: 150,
      todayCount: 47,
      criticalCount: 3,
      new: 15,
      active: 25,
      resolved: 110,
      byPriority: { critical: 3, high: 12, medium: 35, low: 100 }
    })),
    filteredActivities: [
      {
        id: '1',
        title: 'Test Activity 1',
        type: 'security-breach',
        priority: 'high',
        status: 'new',
        timestamp: new Date(),
        location: 'Building A',
        description: 'Test activity description'
      }
    ],
    loading: false,
    error: null,
    createActivity: vi.fn()
  })
}))

vi.mock('../../services/ServiceProvider', () => ({
  useServices: () => ({
    isInitialized: true
  })
}))

// Mock complex child components
vi.mock('../../components/EnterpriseActivityManager', () => ({
  EnterpriseActivityManager: ({ activities, onActivitySelect, onActivityAction, onBulkAction }: any) => (
    <div data-testid="enterprise-activity-manager">
      Enterprise Activity Manager
      <div>Activities Count: {activities?.length || 0}</div>
      <button onClick={() => onActivitySelect({ id: '1', title: 'Test Activity' })}>
        Select Activity
      </button>
      <button onClick={() => onActivityAction('escalate', { id: '1' })}>
        Activity Action
      </button>
      <button onClick={() => onBulkAction('assign', [{ id: '1' }])}>
        Bulk Action
      </button>
    </div>
  )
}))

vi.mock('../../components/ResponsiveActivityDetail', () => ({
  ResponsiveActivityDetail: ({ activity, isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="activity-detail-modal">
        Activity Detail: {activity?.title || 'No Title'}
        <button onClick={onClose}>Close Detail</button>
      </div>
    ) : null
}))

vi.mock('../../components/CommunicationsPanel', () => ({
  CommunicationsPanel: ({ onOpenModal, onOpenFullPage, activities }: any) => (
    <div data-testid="communications-panel">
      Communications Panel
      <div>Activities: {activities?.length || 0}</div>
      <button onClick={onOpenModal}>Open Radio Modal</button>
      <button onClick={onOpenFullPage}>Open Full Comms</button>
    </div>
  )
}))

vi.mock('../../components/RadioModal', () => ({
  RadioModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="radio-modal">
        Radio Modal
        <button onClick={onClose}>Close Radio</button>
      </div>
    ) : null
}))

vi.mock('../../components/CommunicationsPage', () => ({
  CommunicationsPage: ({ onBackToActivities }: any) => (
    <div data-testid="communications-page">
      Communications Page
      <button onClick={onBackToActivities}>Back to Activities</button>
    </div>
  )
}))

vi.mock('../../components/CreateActivityModal', () => ({
  CreateActivityModal: ({ onActivityCreated, trigger }: any) => (
    <div data-testid="create-activity-wrapper">
      {trigger}
      <div data-testid="create-activity-modal" style={{ display: 'none' }}>
        Create Activity Modal
        <button onClick={onActivityCreated}>Create Activity</button>
      </div>
    </div>
  )
}))

describe('Activities Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the main activities layout', () => {
    render(<Activities />)
    
    // Check header elements
    expect(screen.getByText('Enterprise Activities Center')).toBeInTheDocument()
    expect(screen.getByText('Amazon-scale security operations')).toBeInTheDocument()
    
    // Check main components
    expect(screen.getByTestId('enterprise-activity-manager')).toBeInTheDocument()
    expect(screen.getByTestId('communications-panel')).toBeInTheDocument()
  })

  it('should display facility statistics correctly', () => {
    render(<Activities />)
    
    // Check statistics are displayed
    expect(screen.getByText('847')).toBeInTheDocument() // Total cameras
    expect(screen.getByText('150')).toBeInTheDocument() // Total activities  
    expect(screen.getByText('3')).toBeInTheDocument() // Critical today
    expect(screen.getByText('32')).toBeInTheDocument() // Buildings monitored
    expect(screen.getByText('2,847')).toBeInTheDocument() // Employees on site
    expect(screen.getByText('99.97%')).toBeInTheDocument() // System uptime
    expect(screen.getByText('23')).toBeInTheDocument() // Security personnel
    expect(screen.getByText('4.2 minutes')).toBeInTheDocument() // Average response time
    
    // Check labels
    expect(screen.getByText('Cameras')).toBeInTheDocument()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Buildings')).toBeInTheDocument()
    expect(screen.getByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Response')).toBeInTheDocument()
  })

  it('should show service status indicators', () => {
    render(<Activities />)
    
    // Check service status badge
    expect(screen.getByText('Services Active')).toBeInTheDocument()
    expect(screen.getByText('847 cameras')).toBeInTheDocument()
  })

  it('should handle loading states', () => {
    // Mock loading state
    const mockUseActivityStore = vi.fn(() => ({
      getActivityStats: vi.fn(() => ({
        total: 0,
        todayCount: 0,
        criticalCount: 0,
        new: 0,
        active: 0,
        resolved: 0,
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 }
      })),
      filteredActivities: [],
      loading: true,
      error: null,
      createActivity: vi.fn()
    }))

    vi.mocked(require('../../stores').useActivityStore).mockImplementation(mockUseActivityStore)

    render(<Activities />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should handle error states', () => {
    // Mock error state
    const mockUseActivityStore = vi.fn(() => ({
      getActivityStats: vi.fn(() => ({
        total: 0,
        todayCount: 0,
        criticalCount: 0,
        new: 0,
        active: 0,
        resolved: 0,
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 }
      })),
      filteredActivities: [],
      loading: false,
      error: 'Failed to load activities',
      createActivity: vi.fn()
    }))

    vi.mocked(require('../../stores').useActivityStore).mockImplementation(mockUseActivityStore)

    render(<Activities />)
    
    expect(screen.getByText('Failed to load activities')).toBeInTheDocument()
  })

  it('should handle activity selection and detail modal', async () => {
    render(<Activities />)
    
    // Click on select activity button in enterprise manager
    const selectButton = screen.getByRole('button', { name: /select activity/i })
    await user.click(selectButton)
    
    // Activity detail modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('activity-detail-modal')).toBeInTheDocument()
    })
    
    // Close the modal
    const closeButton = screen.getByRole('button', { name: /close detail/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('activity-detail-modal')).not.toBeInTheDocument()
    })
  })

  it('should handle radio modal interactions', async () => {
    render(<Activities />)
    
    // Click radio button in header
    const radioButton = screen.getByRole('button', { name: /radio/i })
    await user.click(radioButton)
    
    // Radio modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('radio-modal')).toBeInTheDocument()
    })
  })

  it('should handle communications page navigation', async () => {
    render(<Activities />)
    
    // Click communications button in header
    const commsButton = screen.getByRole('button', { name: /comms/i })
    await user.click(commsButton)
    
    // Communications page should appear
    await waitFor(() => {
      expect(screen.getByTestId('communications-page')).toBeInTheDocument()
    })
  })

  it('should pass activities to child components', () => {
    render(<Activities />)
    
    // Check that enterprise activity manager receives activities
    expect(screen.getByText('Activities Count: 1')).toBeInTheDocument()
    
    // Check that communications panel receives activities
    expect(screen.getByText('Activities: 1')).toBeInTheDocument()
  })

  it('should handle activity actions from enterprise manager', async () => {
    render(<Activities />)
    
    // Click activity action button
    const actionButton = screen.getByRole('button', { name: /activity action/i })
    await user.click(actionButton)
    
    // This should trigger the onActivityAction callback
    // (In a real test, we'd check console.log or mock the function)
  })

  it('should handle bulk actions from enterprise manager', async () => {
    render(<Activities />)
    
    // Click bulk action button
    const bulkActionButton = screen.getByRole('button', { name: /bulk action/i })
    await user.click(bulkActionButton)
    
    // This should trigger the onBulkAction callback
  })

  it('should display create activity button', () => {
    render(<Activities />)
    
    expect(screen.getByRole('button', { name: /create activity/i })).toBeInTheDocument()
  })

  it('should show critical activity indicators with animation', () => {
    render(<Activities />)
    
    // Critical count card should have special styling
    const criticalCard = screen.getByText('3').closest('.border-red-200')
    expect(criticalCard).toBeInTheDocument()
  })

  it('should handle service initialization status', () => {
    // Mock uninitialized services
    const mockUseServices = vi.fn(() => ({
      isInitialized: false
    }))

    vi.mocked(require('../../services/ServiceProvider').useServices).mockImplementation(mockUseServices)

    render(<Activities />)
    
    expect(screen.getByText('Initializing')).toBeInTheDocument()
  })

  it('should display responsive layout classes', () => {
    render(<Activities />)
    
    // Check that responsive classes are applied to stats grid
    const statsContainer = screen.getByText('Cameras').closest('.grid')
    expect(statsContainer).toHaveClass('grid-cols-4', 'md:grid-cols-6', 'lg:grid-cols-8')
  })

  it('should handle communications panel modal triggers', async () => {
    render(<Activities />)
    
    // Communications panel should have buttons to trigger modals
    const openRadioButton = screen.getByRole('button', { name: /open radio modal/i })
    const openFullCommsButton = screen.getByRole('button', { name: /open full comms/i })
    
    expect(openRadioButton).toBeInTheDocument()
    expect(openFullCommsButton).toBeInTheDocument()
    
    // Test clicking them
    await user.click(openRadioButton)
    await user.click(openFullCommsButton)
  })
})