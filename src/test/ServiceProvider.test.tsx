import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ServiceProvider, useServices } from '../../services/ServiceProvider'

// Mock the individual services
vi.mock('../../services/activity.service', () => ({
  ActivityService: vi.fn().mockImplementation(() => ({
    checkActivity: vi.fn(),
    createActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
    getActivities: vi.fn()
  }))
}))

vi.mock('../../services/incident.service', () => ({
  IncidentService: vi.fn().mockImplementation(() => ({
    createIncident: vi.fn(),
    updateIncident: vi.fn(),
    getIncidents: vi.fn()
  }))
}))

vi.mock('../../services/case.service', () => ({
  CaseService: vi.fn().mockImplementation(() => ({
    createCase: vi.fn(),
    updateCase: vi.fn(),
    getCases: vi.fn()
  }))
}))

vi.mock('../../services/audit.service', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    logAuditEntry: vi.fn(),
    getAuditLog: vi.fn()
  }))
}))

vi.mock('../../services/bol.service', () => ({
  BOLService: vi.fn().mockImplementation(() => ({
    checkNewActivity: vi.fn(),
    updateBOL: vi.fn(),
    getBOLs: vi.fn()
  }))
}))

// Test component that uses the services
function TestComponent() {
  const { 
    activityService, 
    incidentService, 
    caseService, 
    auditService, 
    bolService, 
    isInitialized 
  } = useServices()

  return (
    <div>
      <div data-testid="initialization-status">
        {isInitialized ? 'Services Initialized' : 'Services Not Initialized'}
      </div>
      <div data-testid="activity-service">
        {activityService ? 'Activity Service Available' : 'Activity Service Not Available'}
      </div>
      <div data-testid="incident-service">
        {incidentService ? 'Incident Service Available' : 'Incident Service Not Available'}
      </div>
      <div data-testid="case-service">
        {caseService ? 'Case Service Available' : 'Case Service Not Available'}
      </div>
      <div data-testid="audit-service">
        {auditService ? 'Audit Service Available' : 'Audit Service Not Available'}
      </div>
      <div data-testid="bol-service">
        {bolService ? 'BOL Service Available' : 'BOL Service Not Available'}
      </div>
    </div>
  )
}

// Test component without ServiceProvider wrapper
function TestComponentWithoutProvider() {
  try {
    const services = useServices()
    return <div>Should not reach here</div>
  } catch (error) {
    return <div data-testid="error">Error: useServices must be used within a ServiceProvider</div>
  }
}

describe('ServiceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide all services when properly wrapped', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialization-status')).toHaveTextContent('Services Initialized')
    })

    expect(screen.getByTestId('activity-service')).toHaveTextContent('Activity Service Available')
    expect(screen.getByTestId('incident-service')).toHaveTextContent('Incident Service Available')
    expect(screen.getByTestId('case-service')).toHaveTextContent('Case Service Available')
    expect(screen.getByTestId('audit-service')).toHaveTextContent('Audit Service Available')
    expect(screen.getByTestId('bol-service')).toHaveTextContent('BOL Service Available')
  })

  it('should throw error when useServices is used without provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponentWithoutProvider />)
    }).toThrow('useServices must be used within a ServiceProvider')

    consoleSpy.mockRestore()
  })

  it('should initialize services on mount', async () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    // Should show initialization status
    await waitFor(() => {
      expect(screen.getByTestId('initialization-status')).toHaveTextContent('Services Initialized')
    })
  })

  it('should provide consistent service instances', async () => {
    let firstServices: any
    let secondServices: any

    function FirstTestComponent() {
      firstServices = useServices()
      return <div>First Component</div>
    }

    function SecondTestComponent() {
      secondServices = useServices()
      return <div>Second Component</div>
    }

    render(
      <ServiceProvider>
        <FirstTestComponent />
        <SecondTestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(firstServices).toBeDefined()
      expect(secondServices).toBeDefined()
    })

    // Services should be the same instances
    expect(firstServices.activityService).toBe(secondServices.activityService)
    expect(firstServices.incidentService).toBe(secondServices.incidentService)
    expect(firstServices.caseService).toBe(secondServices.caseService)
    expect(firstServices.auditService).toBe(secondServices.auditService)
    expect(firstServices.bolService).toBe(secondServices.bolService)
  })

  it('should handle service initialization errors gracefully', async () => {
    // Mock one service to throw an error during initialization
    const mockActivityService = vi.fn().mockImplementation(() => {
      throw new Error('Service initialization failed')
    })

    vi.mocked(require('../../services/activity.service').ActivityService).mockImplementation(mockActivityService)

    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    // Should still render but services might not be fully initialized
    expect(screen.getByTestId('initialization-status')).toBeInTheDocument()
  })

  it('should provide createAuditContext utility', () => {
    const { createAuditContext } = require('../../services/ServiceProvider')
    
    const context = createAuditContext(
      'user-123',
      'Test User',
      'officer',
      'test_action',
      'Test action details'
    )

    expect(context).toEqual({
      userId: 'user-123',
      userName: 'Test User',
      userRole: 'officer',
      action: 'test_action',
      details: 'Test action details'
    })
  })

  it('should re-render components when services change', async () => {
    const { rerender } = render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('initialization-status')).toHaveTextContent('Services Initialized')
    })

    // Re-render with the same provider
    rerender(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    // Should still show initialized services
    expect(screen.getByTestId('initialization-status')).toHaveTextContent('Services Initialized')
  })
})

// Integration tests with stores
describe('ServiceProvider Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work with activity store operations', async () => {
    function ActivityStoreTestComponent() {
      const { activityService, isInitialized } = useServices()

      const handleCreateActivity = async () => {
        if (activityService && isInitialized) {
          try {
            await activityService.createActivity({
              title: 'Test Activity',
              description: 'Test Description',
              location: 'Test Location',
              type: 'patrol',
              priority: 'medium',
              reported_by: 'Test User'
            })
          } catch (error) {
            console.error('Activity creation failed:', error)
          }
        }
      }

      return (
        <div>
          <div data-testid="service-ready">
            {isInitialized && activityService ? 'Ready' : 'Not Ready'}
          </div>
          <button onClick={handleCreateActivity} data-testid="create-activity">
            Create Activity
          </button>
        </div>
      )
    }

    render(
      <ServiceProvider>
        <ActivityStoreTestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('service-ready')).toHaveTextContent('Ready')
    })

    const createButton = screen.getByTestId('create-activity')
    expect(createButton).toBeInTheDocument()
  })

  it('should handle audit logging for service operations', async () => {
    function AuditTestComponent() {
      const { auditService, isInitialized } = useServices()

      const handleLogAudit = async () => {
        if (auditService && isInitialized) {
          await auditService.logAuditEntry(
            {
              userId: 'test-user',
              userName: 'Test User',
              userRole: 'officer',
              action: 'test_action',
              details: 'Test audit entry'
            },
            'activity',
            'test-id',
            'create',
            { test: 'data' }
          )
        }
      }

      return (
        <div>
          <div data-testid="audit-ready">
            {isInitialized && auditService ? 'Audit Ready' : 'Audit Not Ready'}
          </div>
          <button onClick={handleLogAudit} data-testid="log-audit">
            Log Audit
          </button>
        </div>
      )
    }

    render(
      <ServiceProvider>
        <AuditTestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('audit-ready')).toHaveTextContent('Audit Ready')
    })

    const logButton = screen.getByTestId('log-audit')
    expect(logButton).toBeInTheDocument()
  })

  it('should handle BOL service integration', async () => {
    function BOLTestComponent() {
      const { bolService, isInitialized } = useServices()

      const handleCheckBOL = async () => {
        if (bolService && isInitialized) {
          await bolService.checkNewActivity(
            {
              id: 'test-activity',
              title: 'Test Activity',
              type: 'security-breach',
              priority: 'high',
              timestamp: new Date(),
              location: 'Test Location'
            },
            {
              userId: 'test-user',
              userName: 'Test User',
              userRole: 'officer',
              action: 'check_bol',
              details: 'Checking BOL for activity'
            }
          )
        }
      }

      return (
        <div>
          <div data-testid="bol-ready">
            {isInitialized && bolService ? 'BOL Ready' : 'BOL Not Ready'}
          </div>
          <button onClick={handleCheckBOL} data-testid="check-bol">
            Check BOL
          </button>
        </div>
      )
    }

    render(
      <ServiceProvider>
        <BOLTestComponent />
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('bol-ready')).toHaveTextContent('BOL Ready')
    })

    const checkButton = screen.getByTestId('check-bol')
    expect(checkButton).toBeInTheDocument()
  })
})