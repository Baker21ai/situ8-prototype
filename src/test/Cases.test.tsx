import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cases } from '../../components/Cases'

// Mock the stores
vi.mock('../../stores/caseStore', () => ({
  useCaseStore: () => ({
    cases: [
      {
        id: '1',
        case_number: 'CASE-2024-001',
        title: 'Security Breach Investigation',
        status: 'investigating',
        priority: 'high',
        lead_investigator: 'John Doe',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-16'),
        created_by: 'admin',
        updated_by: 'admin',
        type: 'investigation',
        description: 'Unauthorized access detected in Building A',
        investigators: ['John Doe', 'Jane Smith'],
        linked_incident_ids: ['INC-001'],
        evidence_items: [],
        timeline_events: []
      },
      {
        id: '2',
        case_number: 'CASE-2024-002',
        title: 'Compliance Audit',
        status: 'open',
        priority: 'medium',
        lead_investigator: 'Jane Smith',
        created_at: new Date('2024-01-10'),
        updated_at: new Date('2024-01-12'),
        created_by: 'admin',
        updated_by: 'admin',
        type: 'compliance',
        description: 'Quarterly compliance check',
        investigators: ['Jane Smith'],
        linked_incident_ids: [],
        evidence_items: [],
        timeline_events: []
      }
    ],
    loading: false,
    error: null,
    getStats: vi.fn(() => ({
      total: 2,
      byStatus: {
        open: 1,
        investigating: 1,
        evidence_collection: 0,
        analysis: 0,
        closed: 0
      },
      byPriority: {
        critical: 0,
        high: 1,
        medium: 1,
        low: 0
      },
      criticalCount: 0,
      closedCount: 0
    })),
    createCase: vi.fn(),
    updateCase: vi.fn(),
    deleteCase: vi.fn()
  })
}))

vi.mock('../../services/ServiceProvider', () => ({
  useServices: () => ({
    caseService: {
      createCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn()
    },
    isInitialized: true
  })
}))

// Mock the time utility
vi.mock('../../lib/utils/time', () => ({
  formatDistanceToNow: vi.fn((date: Date) => '2 days ago')
}))

describe('Cases Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the cases page layout', () => {
    render(<Cases />)
    
    // Check header elements
    expect(screen.getByText('Case Management')).toBeInTheDocument()
    expect(screen.getByText('Investigation & compliance tracking')).toBeInTheDocument()
    
    // Check create button
    expect(screen.getByRole('button', { name: /create case/i })).toBeInTheDocument()
  })

  it('should display case statistics correctly', () => {
    render(<Cases />)
    
    // Check statistics cards
    expect(screen.getByText('2')).toBeInTheDocument() // Total cases
    expect(screen.getByText('1')).toBeInTheDocument() // Open cases
    expect(screen.getByText('1')).toBeInTheDocument() // Investigating cases
    expect(screen.getByText('0')).toBeInTheDocument() // Evidence collection
    expect(screen.getByText('0')).toBeInTheDocument() // Critical priority
    expect(screen.getByText('0')).toBeInTheDocument() // Closed cases
    
    // Check stat labels
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Investigating')).toBeInTheDocument()
    expect(screen.getByText('Evidence Collection')).toBeInTheDocument()
    expect(screen.getByText('Critical Priority')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
    render(<Cases />)
    
    // Find search input
    const searchInput = screen.getByPlaceholderText(/search cases/i)
    expect(searchInput).toBeInTheDocument()
    
    // Type in search box
    await user.type(searchInput, 'Security Breach')
    
    // Search input should update
    expect(searchInput).toHaveValue('Security Breach')
  })

  it('should handle status filter', async () => {
    render(<Cases />)
    
    // Find status filter dropdown
    const statusFilter = screen.getByRole('combobox', { name: /status/i })
    expect(statusFilter).toBeInTheDocument()
    
    // Open dropdown and select a status
    await user.click(statusFilter)
    
    await waitFor(() => {
      expect(screen.getByText('Investigating')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Investigating'))
  })

  it('should handle priority filter', async () => {
    render(<Cases />)
    
    // Find priority filter dropdown
    const priorityFilter = screen.getByRole('combobox', { name: /priority/i })
    expect(priorityFilter).toBeInTheDocument()
    
    // Open dropdown and select a priority
    await user.click(priorityFilter)
    
    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument()
    })
  })

  it('should handle type filter', async () => {
    render(<Cases />)
    
    // Find type filter dropdown
    const typeFilter = screen.getByRole('combobox', { name: /type/i })
    expect(typeFilter).toBeInTheDocument()
    
    // Open dropdown and select a type
    await user.click(typeFilter)
    
    await waitFor(() => {
      expect(screen.getByText('Investigation')).toBeInTheDocument()
    })
  })

  it('should toggle between grid and list view modes', async () => {
    render(<Cases />)
    
    // Find view mode buttons
    const gridButton = screen.getByRole('button', { name: /grid/i })
    const listButton = screen.getByRole('button', { name: /list/i })
    
    expect(gridButton).toBeInTheDocument()
    expect(listButton).toBeInTheDocument()
    
    // Default should be grid view
    expect(gridButton).toHaveClass('bg-primary')
    
    // Switch to list view
    await user.click(listButton)
    
    // List button should now be active
    await waitFor(() => {
      expect(listButton).toHaveClass('bg-primary')
    })
  })

  it('should display cases in grid view', () => {
    render(<Cases />)
    
    // Should show cases from mock data
    expect(screen.getByText('Security Breach Investigation')).toBeInTheDocument()
    expect(screen.getByText('Compliance Audit')).toBeInTheDocument()
    expect(screen.getByText('CASE-2024-001')).toBeInTheDocument()
    expect(screen.getByText('CASE-2024-002')).toBeInTheDocument()
  })

  it('should handle create case dialog', async () => {
    render(<Cases />)
    
    // Click create case button
    const createButton = screen.getByRole('button', { name: /create case/i })
    await user.click(createButton)
    
    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Create New Case')).toBeInTheDocument()
    })
    
    // Should have form fields
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('should handle case creation', async () => {
    render(<Cases />)
    
    // Open create dialog
    const createButton = screen.getByRole('button', { name: /create case/i })
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Create New Case')).toBeInTheDocument()
    })
    
    // Fill in form
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'New Test Case')
    
    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'Test case description')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create case$/i })
    await user.click(submitButton)
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Create New Case')).not.toBeInTheDocument()
    })
  })

  it('should handle loading state', () => {
    // Mock loading state
    const mockUseCaseStore = vi.fn(() => ({
      cases: [],
      loading: true,
      error: null,
      getStats: vi.fn(() => ({
        total: 0,
        byStatus: { open: 0, investigating: 0, evidence_collection: 0, analysis: 0, closed: 0 },
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        criticalCount: 0,
        closedCount: 0
      })),
      createCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn()
    }))

    vi.mocked(require('../../stores/caseStore').useCaseStore).mockImplementation(mockUseCaseStore)

    render(<Cases />)
    
    expect(screen.getByText('Loading cases...')).toBeInTheDocument()
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // spinner
  })

  it('should handle error state', () => {
    // Mock error state
    const mockUseCaseStore = vi.fn(() => ({
      cases: [],
      loading: false,
      error: 'Failed to load cases',
      getStats: vi.fn(() => ({
        total: 0,
        byStatus: { open: 0, investigating: 0, evidence_collection: 0, analysis: 0, closed: 0 },
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        criticalCount: 0,
        closedCount: 0
      })),
      createCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn()
    }))

    vi.mocked(require('../../stores/caseStore').useCaseStore).mockImplementation(mockUseCaseStore)

    render(<Cases />)
    
    expect(screen.getByText('Failed to load cases')).toBeInTheDocument()
  })

  it('should handle empty state', () => {
    // Mock empty state
    const mockUseCaseStore = vi.fn(() => ({
      cases: [],
      loading: false,
      error: null,
      getStats: vi.fn(() => ({
        total: 0,
        byStatus: { open: 0, investigating: 0, evidence_collection: 0, analysis: 0, closed: 0 },
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        criticalCount: 0,
        closedCount: 0
      })),
      createCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn()
    }))

    vi.mocked(require('../../stores/caseStore').useCaseStore).mockImplementation(mockUseCaseStore)

    render(<Cases />)
    
    expect(screen.getByText('No cases found')).toBeInTheDocument()
    expect(screen.getByText('Create your first case to get started')).toBeInTheDocument()
  })

  it('should display case status badges with correct colors', () => {
    render(<Cases />)
    
    // Find investigating status badge
    const investigatingBadge = screen.getByText('investigating')
    expect(investigatingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    
    // Find open status badge
    const openBadge = screen.getByText('open')
    expect(openBadge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('should display priority badges with correct colors', () => {
    render(<Cases />)
    
    // Find high priority badge
    const highBadge = screen.getByText('high')
    expect(highBadge).toHaveClass('bg-orange-100', 'text-orange-800')
    
    // Find medium priority badge
    const mediumBadge = screen.getByText('medium')
    expect(mediumBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('should handle case view action', async () => {
    render(<Cases />)
    
    // Find a case card and click view
    const caseTitle = screen.getByText('Security Breach Investigation')
    expect(caseTitle).toBeInTheDocument()
    
    // In a real implementation, there would be a view button or clickable card
    // This test would verify that clicking opens the case detail view
  })

  it('should show case investigators', () => {
    render(<Cases />)
    
    // Should show lead investigator information
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should show case numbers', () => {
    render(<Cases />)
    
    // Should display case numbers
    expect(screen.getByText('CASE-2024-001')).toBeInTheDocument()
    expect(screen.getByText('CASE-2024-002')).toBeInTheDocument()
  })

  it('should show case types', () => {
    render(<Cases />)
    
    // Should display case types
    expect(screen.getByText('investigation')).toBeInTheDocument()
    expect(screen.getByText('compliance')).toBeInTheDocument()
  })
})