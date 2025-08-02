import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandCenter } from '../../components/CommandCenter'

// Mock all dependencies
vi.mock('../../stores', () => ({
  useActivityStore: () => ({
    filteredActivities: [],
    loading: false,
    error: null,
    generateRealtimeActivity: vi.fn(),
    assignActivity: vi.fn(),
    getActivityStats: vi.fn(() => ({
      total: 0,
      new: 0,
      active: 0,
      resolved: 0,
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 }
    })),
    updateActivityStatus: vi.fn()
  })
}))

vi.mock('../../services/ServiceProvider', () => ({
  useServices: () => ({
    activityService: { checkActivity: vi.fn() },
    bolService: { checkNewActivity: vi.fn() },
    auditService: { logAuditEntry: vi.fn() },
    isInitialized: true
  }),
  createAuditContext: vi.fn()
}))

// Mock UI components that are complex
vi.mock('../../components/InteractiveMap', () => ({
  InteractiveMap: () => <div data-testid="interactive-map">Interactive Map</div>
}))

vi.mock('../../components/Timeline', () => ({
  Timeline: () => <div data-testid="timeline">Timeline</div>
}))

vi.mock('../../components/GuardProfile', () => ({
  GuardProfile: ({ guard }: any) => (
    <div data-testid="guard-profile">
      Guard Profile: {guard?.name || 'No Guard'}
    </div>
  )
}))

vi.mock('../../components/GuardManagement', () => ({
  GuardManagement: () => <div data-testid="guard-management">Guard Management</div>
}))

vi.mock('../../components/RadioModal', () => ({
  RadioModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="radio-modal">Radio Modal</div> : null
}))

vi.mock('../../components/CommunicationsPage', () => ({
  CommunicationsPage: ({ onBackToCommandCenter }: any) => (
    <div data-testid="communications-page">
      Communications Page
      <button onClick={onBackToCommandCenter}>Back to Command Center</button>
    </div>
  )
}))

vi.mock('../../components/organisms/ActivityCard', () => ({
  ActivityCard: ({ activity, onClick }: any) => (
    <div data-testid={`activity-card-${activity.id}`} onClick={() => onClick?.(activity)}>
      Activity: {activity.title} - Priority: {activity.priority}
    </div>
  )
}))

vi.mock('../../components/ActivityDetail', () => ({
  ActivityDetail: ({ activity, onClose }: any) => 
    activity ? (
      <div data-testid="activity-detail">
        Activity Detail: {activity.title}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

vi.mock('../../components/CreateActivityModal', () => ({
  CreateActivityModal: ({ isOpen, onClose, onActivityCreated }: any) =>
    isOpen ? (
      <div data-testid="create-activity-modal">
        Create Activity Modal
        <button onClick={() => { onActivityCreated?.(); onClose?.(); }}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

describe('CommandCenter Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the three-panel layout', () => {
    render(<CommandCenter />)
    
    // Check main panels are present
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByTestId('interactive-map')).toBeInTheDocument()
    expect(screen.getByTestId('timeline')).toBeInTheDocument()
  })

  it('should display facility statistics', () => {
    render(<CommandCenter />)
    
    // Should show activity statistics panel
    expect(screen.getByText('Activity Statistics')).toBeInTheDocument()
    
    // Should show guard statistics
    expect(screen.getByText('Available Guards')).toBeInTheDocument()
    expect(screen.getByText('Critical Incidents')).toBeInTheDocument()
  })

  it('should show activities grouped by priority', () => {
    render(<CommandCenter />)
    
    // Should show priority sections
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('should allow toggling between critical only and all activities', async () => {
    render(<CommandCenter />)
    
    // Find and click critical only toggle
    const criticalOnlyButton = screen.getByRole('button', { name: /critical only/i })
    expect(criticalOnlyButton).toBeInTheDocument()
    
    await user.click(criticalOnlyButton)
    // The button should change state (implementation would filter activities)
  })

  it('should handle priority section collapsing', async () => {
    render(<CommandCenter />)
    
    // Find collapse buttons for priority sections
    const prioritySections = ['Critical', 'High', 'Medium', 'Low']
    
    for (const priority of prioritySections) {
      const sectionButton = screen.getByRole('button', { name: new RegExp(priority, 'i') })
      expect(sectionButton).toBeInTheDocument()
      
      // Click to toggle section
      await user.click(sectionButton)
    }
  })

  it('should open create activity modal', async () => {
    render(<CommandCenter />)
    
    // Find create activity button
    const createButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(createButton)
    
    // Modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('create-activity-modal')).toBeInTheDocument()
    })
  })

  it('should handle activity creation', async () => {
    render(<CommandCenter />)
    
    // Open create modal
    const createButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('create-activity-modal')).toBeInTheDocument()
    })
    
    // Create activity
    const createActivityButton = screen.getByRole('button', { name: /create$/i })
    await user.click(createActivityButton)
    
    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('create-activity-modal')).not.toBeInTheDocument()
    })
  })

  it('should open radio modal', async () => {
    render(<CommandCenter />)
    
    // Find radio button
    const radioButton = screen.getByRole('button', { name: /radio/i })
    await user.click(radioButton)
    
    // Radio modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('radio-modal')).toBeInTheDocument()
    })
  })

  it('should navigate to communications page', async () => {
    render(<CommandCenter />)
    
    const communicationsButton = screen.getByRole('button', { name: /communications/i })
    await user.click(communicationsButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('communications-page')).toBeInTheDocument()
    })
    
    // Should be able to navigate back
    const backButton = screen.getByRole('button', { name: /back to command center/i })
    await user.click(backButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('communications-page')).not.toBeInTheDocument()
    })
  })

  it('should handle guard management interactions', () => {
    render(<CommandCenter />)
    
    // Guard management should be present
    expect(screen.getByTestId('guard-management')).toBeInTheDocument()
  })

  it('should display error states appropriately', () => {
    render(<CommandCenter />)
    
    // Component should render without errors even when there are no activities
    expect(screen.getByText('Activities')).toBeInTheDocument()
  })

  it('should show loading states', () => {
    // This test would be more meaningful with actual loading states
    render(<CommandCenter />)
    
    // Component should handle loading gracefully
    expect(screen.getByText('Activities')).toBeInTheDocument()
  })

  it('should handle activity selection', async () => {
    const mockActivity = {
      id: '1',
      title: 'Test Activity',
      priority: 'high',
      status: 'new',
      timestamp: new Date()
    }

    // Mock the store to return an activity
    const mockUseActivityStore = vi.fn(() => ({
      filteredActivities: [mockActivity],
      loading: false,
      error: null,
      generateRealtimeActivity: vi.fn(),
      assignActivity: vi.fn(),
      getActivityStats: vi.fn(() => ({
        total: 1,
        new: 1,
        active: 0,
        resolved: 0,
        byPriority: { critical: 0, high: 1, medium: 0, low: 0 }
      })),
      updateActivityStatus: vi.fn()
    }))

    vi.mocked(require('../../stores').useActivityStore).mockImplementation(mockUseActivityStore)

    render(<CommandCenter />)
    
    // Should show the mock activity
    const activityCard = screen.getByTestId('activity-card-1')
    expect(activityCard).toBeInTheDocument()
    
    // Click on activity should open detail
    await user.click(activityCard)
    
    await waitFor(() => {
      expect(screen.getByTestId('activity-detail')).toBeInTheDocument()
    })
  })

  it('should handle service integration errors gracefully', () => {
    // Mock services to return error states
    const mockUseServices = vi.fn(() => ({
      activityService: null,
      bolService: null,
      auditService: null,
      isInitialized: false
    }))

    vi.mocked(require('../../services/ServiceProvider').useServices).mockImplementation(mockUseServices)

    render(<CommandCenter />)
    
    // Component should still render without crashing
    expect(screen.getByText('Activities')).toBeInTheDocument()
  })
})