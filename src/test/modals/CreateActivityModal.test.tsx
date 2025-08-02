import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateActivityModal } from '../../components/CreateActivityModal'

// Mock the stores
vi.mock('../../stores', () => ({
  useActivityStore: () => ({
    createActivity: vi.fn().mockResolvedValue({ success: true })
  })
}))

// Mock the service provider
vi.mock('../../services/ServiceProvider', () => ({
  createAuditContext: vi.fn(() => ({
    userId: 'test-user',
    userName: 'Test User',
    userRole: 'officer',
    action: 'create_activity',
    details: 'Creating new activity'
  }))
}))

describe('CreateActivityModal Component', () => {
  const user = userEvent.setup()
  const mockOnActivityCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default trigger button', () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    expect(triggerButton).toBeInTheDocument()
  })

  it('should render with custom trigger', () => {
    const customTrigger = <button>Custom Trigger</button>
    
    render(
      <CreateActivityModal 
        trigger={customTrigger}
        onActivityCreated={mockOnActivityCreated} 
      />
    )
    
    expect(screen.getByRole('button', { name: /custom trigger/i })).toBeInTheDocument()
  })

  it('should open modal when trigger is clicked', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText('Create New Activity')).toBeInTheDocument()
    })
  })

  it('should display all form fields when modal is open', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
      expect(screen.getByText(/activity type/i)).toBeInTheDocument()
      expect(screen.getByText(/priority/i)).toBeInTheDocument()
      expect(screen.getByText(/building/i)).toBeInTheDocument()
      expect(screen.getByText(/zone/i)).toBeInTheDocument()
    })
  })

  it('should have correct default form values', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement
      const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement
      
      expect(titleInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
      expect(locationInput.value).toBe('')
      
      // Check default selections
      expect(screen.getByText('Patrol')).toBeInTheDocument() // Default type
      expect(screen.getByText('Medium')).toBeInTheDocument() // Default priority
      expect(screen.getByText('Building A')).toBeInTheDocument() // Default building
    })
  })

  it('should update form fields when user types', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const locationInput = screen.getByLabelText(/location/i)
    
    await user.type(titleInput, 'Test Activity Title')
    await user.type(descriptionInput, 'Test activity description')
    await user.type(locationInput, 'Test Location')
    
    expect(titleInput).toHaveValue('Test Activity Title')
    expect(descriptionInput).toHaveValue('Test activity description')
    expect(locationInput).toHaveValue('Test Location')
  })

  it('should handle activity type selection', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText(/activity type/i)).toBeInTheDocument()
    })
    
    // Open type dropdown
    const typeSelect = screen.getByRole('combobox', { name: /activity type/i })
    await user.click(typeSelect)
    
    // Select Medical Emergency
    await waitFor(() => {
      expect(screen.getByText('Medical Emergency')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Medical Emergency'))
    
    // Verify selection
    await waitFor(() => {
      expect(screen.getByDisplayValue('Medical Emergency')).toBeInTheDocument()
    })
  })

  it('should handle priority selection', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText(/priority/i)).toBeInTheDocument()
    })
    
    // Open priority dropdown
    const prioritySelect = screen.getByRole('combobox', { name: /priority/i })
    await user.click(prioritySelect)
    
    // Select Critical
    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Critical'))
    
    // Verify selection
    await waitFor(() => {
      expect(screen.getByDisplayValue('Critical')).toBeInTheDocument()
    })
  })

  it('should handle building and zone selection', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByText(/building/i)).toBeInTheDocument()
    })
    
    // Change building
    const buildingSelect = screen.getByRole('combobox', { name: /building/i })
    await user.click(buildingSelect)
    
    await waitFor(() => {
      expect(screen.getByText('Building B')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Building B'))
    
    // Zone should update based on building selection
    await waitFor(() => {
      expect(screen.getByText('Zone B-1')).toBeInTheDocument()
    })
  })

  it('should show validation errors for required fields', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create activity$/i })).toBeInTheDocument()
    })
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('should clear validation errors when user starts typing', async () => {
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create activity$/i })).toBeInTheDocument()
    })
    
    // Submit to trigger validation error
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
    
    // Start typing in title field
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'A')
    
    // Error should clear
    await waitFor(() => {
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const mockCreateActivity = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(require('../../stores').useActivityStore).mockImplementation(() => ({
      createActivity: mockCreateActivity
    }))
    
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    // Fill out form
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const locationInput = screen.getByLabelText(/location/i)
    
    await user.type(titleInput, 'Test Activity')
    await user.type(descriptionInput, 'Test description')
    await user.type(locationInput, 'Test location')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    // Should call createActivity
    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Activity',
          description: 'Test description',
          location: 'Test location'
        }),
        expect.any(Object) // audit context
      )
    })
    
    // Should call onActivityCreated callback
    expect(mockOnActivityCreated).toHaveBeenCalled()
  })

  it('should handle submission errors gracefully', async () => {
    const mockCreateActivity = vi.fn().mockRejectedValue(new Error('Creation failed'))
    
    vi.mocked(require('../../stores').useActivityStore).mockImplementation(() => ({
      createActivity: mockCreateActivity
    }))
    
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    // Fill out form
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'Test Activity')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create activity/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button while submitting', async () => {
    const mockCreateActivity = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    vi.mocked(require('../../stores').useActivityStore).mockImplementation(() => ({
      createActivity: mockCreateActivity
    }))
    
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    // Fill out form
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'Test Activity')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled()
  })

  it('should close modal and reset form after successful submission', async () => {
    const mockCreateActivity = vi.fn().mockResolvedValue({ success: true })
    
    vi.mocked(require('../../stores').useActivityStore).mockImplementation(() => ({
      createActivity: mockCreateActivity
    }))
    
    render(<CreateActivityModal onActivityCreated={mockOnActivityCreated} />)
    
    const triggerButton = screen.getByRole('button', { name: /create activity/i })
    await user.click(triggerButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
    
    // Fill out form
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'Test Activity')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create activity$/i })
    await user.click(submitButton)
    
    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Create New Activity')).not.toBeInTheDocument()
    })
    
    // If we open modal again, form should be reset
    await user.click(screen.getByRole('button', { name: /create activity/i }))
    
    await waitFor(() => {
      const resetTitleInput = screen.getByLabelText(/title/i)
      expect(resetTitleInput).toHaveValue('')
    })
  })
})