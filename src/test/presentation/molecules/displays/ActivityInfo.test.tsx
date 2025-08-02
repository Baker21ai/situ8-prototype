import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ActivityInfo,
  ActivityInfoProps,
  ActivityInfoCompact,
  ActivityInfoMinimal,
  ActivityInfoSummary
} from '../../../../presentation/molecules/displays/ActivityInfo'
import {
  createMockActivity,
  createMockActivityWithType,
  createMinimalMockActivity
} from '../../../__mocks__/activityFactory'

// Mock the utility functions
vi.mock('../../../../../lib/utils/security', () => ({
  getTypeIcon: vi.fn((type: string) => {
    const icons: Record<string, string> = {
      'security-breach': '🔓',
      'medical': '🏥',
      'alert': '⚠️',
      'patrol': '👮'
    }
    return icons[type] || '📋'
  })
}))

vi.mock('../../../../../lib/utils/time', () => ({
  formatTime: vi.fn((date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }),
  formatTimeAgo: vi.fn((date: Date) => {
    const now = Date.now()
    const diff = Math.floor((now - date.getTime()) / 60000) // minutes
    if (diff < 1) return 'Now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  })
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MapPin: ({ className, ...props }: any) => (
    <span data-testid="map-pin-icon" className={className} {...props}>📍</span>
  ),
  Clock: ({ className, ...props }: any) => (
    <span data-testid="clock-icon" className={className} {...props}>🕐</span>
  ),
  Camera: ({ className, ...props }: any) => (
    <span data-testid="camera-icon" className={className} {...props}>📷</span>
  )
}))

describe('ActivityInfo', () => {
  const mockActivity = createMockActivity()
  
  const defaultProps: ActivityInfoProps = {
    activity: mockActivity
  }

  it('should render with default props', () => {
    render(<ActivityInfo {...defaultProps} />)
    
    expect(screen.getByText(mockActivity.title)).toBeInTheDocument()
    expect(screen.getByText(mockActivity.type)).toBeInTheDocument()
    expect(screen.getByText(mockActivity.zone)).toBeInTheDocument()
  })

  it('should display activity title', () => {
    const customActivity = createMockActivity({ title: 'Custom Test Activity' })
    render(<ActivityInfo activity={customActivity} />)
    
    expect(screen.getByText('Custom Test Activity')).toBeInTheDocument()
  })

  it('should add title attribute for accessibility', () => {
    render(<ActivityInfo {...defaultProps} />)
    
    const titleElement = screen.getByText(mockActivity.title)
    expect(titleElement).toHaveAttribute('title', mockActivity.title)
  })

  describe('Variant styling', () => {
    it('should apply full variant styles (default)', () => {
      render(<ActivityInfo {...defaultProps} variant="full" />)
      
      const titleElement = screen.getByText(mockActivity.title)
      expect(titleElement).toHaveClass('text-base', 'font-semibold')
      
      const container = titleElement.closest('.space-y-2')
      expect(container).toBeInTheDocument()
    })

    it('should apply compact variant styles', () => {
      render(<ActivityInfo {...defaultProps} variant="compact" />)
      
      const titleElement = screen.getByText(mockActivity.title)
      expect(titleElement).toHaveClass('text-sm', 'font-medium')
      
      const container = titleElement.closest('.space-y-1')
      expect(container).toBeInTheDocument()
    })

    it('should apply minimal variant styles', () => {
      render(<ActivityInfo {...defaultProps} variant="minimal" />)
      
      const titleElement = screen.getByText(mockActivity.title)
      expect(titleElement).toHaveClass('text-xs', 'font-medium')
      
      const container = titleElement.closest('.space-y-0.5')
      expect(container).toBeInTheDocument()
    })

    it('should apply summary variant styles', () => {
      render(<ActivityInfo {...defaultProps} variant="summary" />)
      
      const titleElement = screen.getByText(mockActivity.title)
      expect(titleElement).toHaveClass('text-sm', 'font-medium')
      
      const container = titleElement.closest('.space-y-1')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Type display', () => {
    it('should show activity type by default', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByText(mockActivity.type)).toBeInTheDocument()
      expect(screen.getByText('🔓')).toBeInTheDocument() // Security breach icon
    })

    it('should hide type when showType is false', () => {
      render(<ActivityInfo {...defaultProps} showType={false} />)
      
      expect(screen.queryByText(mockActivity.type)).not.toBeInTheDocument()
      expect(screen.queryByText('🔓')).not.toBeInTheDocument()
    })

    it('should show correct icon for different activity types', () => {
      const medicalActivity = createMockActivityWithType('medical')
      render(<ActivityInfo activity={medicalActivity} />)
      
      expect(screen.getByText('🏥')).toBeInTheDocument()
      expect(screen.getByText('medical')).toBeInTheDocument()
    })
  })

  describe('Time display', () => {
    it('should show relative time by default', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
      // Check for time text (mocked to return 'Now' or relative time)
      expect(screen.getByText(/ago|Now/)).toBeInTheDocument()
    })

    it('should show absolute time when timeFormat is absolute', () => {
      render(<ActivityInfo {...defaultProps} timeFormat="absolute" />)
      
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
      // Should show formatted time (mocked to return time string)
      const timeElement = screen.getByText(/\d{1,2}:\d{2}/)
      expect(timeElement).toBeInTheDocument()
    })

    it('should hide time when showTime is false', () => {
      render(<ActivityInfo {...defaultProps} showTime={false} />)
      
      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Location display', () => {
    it('should show location by default', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.getByText(mockActivity.zone)).toBeInTheDocument()
    })

    it('should fall back to location if zone is not available', () => {
      const activityWithoutZone = createMockActivity({ zone: undefined })
      render(<ActivityInfo activity={activityWithoutZone} />)
      
      expect(screen.getByText(activityWithoutZone.location)).toBeInTheDocument()
    })

    it('should hide location when showLocation is false', () => {
      render(<ActivityInfo {...defaultProps} showLocation={false} />)
      
      expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument()
      expect(screen.queryByText(mockActivity.zone)).not.toBeInTheDocument()
    })
  })

  describe('Camera display', () => {
    it('should show camera name when available', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument()
      expect(screen.getByText(mockActivity.cameraName!)).toBeInTheDocument()
    })

    it('should show additional cameras count', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByText('+2 more')).toBeInTheDocument() // Mock has 2 additional cameras
    })

    it('should hide camera info when showCamera is false', () => {
      render(<ActivityInfo {...defaultProps} showCamera={false} />)
      
      expect(screen.queryByText(mockActivity.cameraName!)).not.toBeInTheDocument()
      expect(screen.queryByText('+2 more')).not.toBeInTheDocument()
    })

    it('should not show camera section when no camera name and showCamera is true', () => {
      const activityWithoutCamera = createMockActivity({ cameraName: undefined, additionalCameras: [] })
      render(<ActivityInfo activity={activityWithoutCamera} />)
      
      // Should only show map pin, not camera icons
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('camera-icon')).not.toBeInTheDocument()
    })
  })

  describe('Assignment display', () => {
    it('should show assigned person when available', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByText(/Assigned: Officer Johnson/)).toBeInTheDocument()
    })

    it('should show responding units count', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      expect(screen.getByText(/2 units responding/)).toBeInTheDocument()
    })

    it('should not show assignment info when not assigned', () => {
      const unassignedActivity = createMockActivity({ 
        assignedTo: undefined, 
        respondingUnits: [] 
      })
      render(<ActivityInfo activity={unassignedActivity} />)
      
      expect(screen.queryByText(/Assigned:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/units responding/)).not.toBeInTheDocument()
    })

    it('should show assignment without responding units', () => {
      const assignedOnlyActivity = createMockActivity({ 
        assignedTo: 'Officer Smith',
        respondingUnits: [] 
      })
      render(<ActivityInfo activity={assignedOnlyActivity} />)
      
      expect(screen.getByText('Assigned: Officer Smith')).toBeInTheDocument()
      expect(screen.queryByText(/units responding/)).not.toBeInTheDocument()
    })
  })

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-activity-info'
      render(<ActivityInfo {...defaultProps} className={customClass} />)
      
      const container = screen.getByText(mockActivity.title).closest('.space-y-2')
      expect(container).toHaveClass(customClass)
    })
  })

  describe('Content visibility based on props', () => {
    it('should hide all optional content when flags are false', () => {
      render(
        <ActivityInfo 
          {...defaultProps} 
          showType={false}
          showLocation={false}
          showTime={false}
          showCamera={false}
        />
      )
      
      // Should only show the title
      expect(screen.getByText(mockActivity.title)).toBeInTheDocument()
      expect(screen.queryByText(mockActivity.type)).not.toBeInTheDocument()
      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('camera-icon')).not.toBeInTheDocument()
    })

    it('should show header row only when type or time is shown', () => {
      const { rerender } = render(
        <ActivityInfo {...defaultProps} showType={false} showTime={false} />
      )
      
      // No header row should be rendered
      expect(screen.queryByText(mockActivity.type)).not.toBeInTheDocument()
      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument()
      
      // Show type only
      rerender(<ActivityInfo {...defaultProps} showType={true} showTime={false} />)
      expect(screen.getByText(mockActivity.type)).toBeInTheDocument()
      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle minimal activity data', () => {
      const minimalActivity = createMinimalMockActivity()
      render(<ActivityInfo activity={minimalActivity} />)
      
      expect(screen.getByText(minimalActivity.title)).toBeInTheDocument()
      expect(screen.getByText(minimalActivity.location)).toBeInTheDocument()
    })

    it('should handle activity without zone or location', () => {
      const activityWithoutLocation = createMockActivity({ 
        zone: undefined, 
        location: '' 
      })
      render(<ActivityInfo activity={activityWithoutLocation} />)
      
      // Should still render without crashing
      expect(screen.getByText(activityWithoutLocation.title)).toBeInTheDocument()
    })

    it('should handle empty title gracefully', () => {
      const activityWithEmptyTitle = createMockActivity({ title: '' })
      render(<ActivityInfo activity={activityWithEmptyTitle} />)
      
      // Should render empty title element
      const titleElement = screen.getByTitle('')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveTextContent('')
    })
  })

  describe('Specialized variant components', () => {
    describe('ActivityInfoCompact', () => {
      it('should render with compact variant', () => {
        render(<ActivityInfoCompact activity={mockActivity} />)
        
        const titleElement = screen.getByText(mockActivity.title)
        expect(titleElement).toHaveClass('text-sm', 'font-medium')
      })

      it('should forward all props except variant', () => {
        render(
          <ActivityInfoCompact 
            activity={mockActivity} 
            showType={false}
            className="custom-compact"
          />
        )
        
        expect(screen.queryByText(mockActivity.type)).not.toBeInTheDocument()
        const container = screen.getByText(mockActivity.title).closest('.space-y-1')
        expect(container).toHaveClass('custom-compact')
      })
    })

    describe('ActivityInfoMinimal', () => {
      it('should render with minimal variant', () => {
        render(<ActivityInfoMinimal activity={mockActivity} />)
        
        const titleElement = screen.getByText(mockActivity.title)
        expect(titleElement).toHaveClass('text-xs', 'font-medium')
      })
    })

    describe('ActivityInfoSummary', () => {
      it('should render with summary variant', () => {
        render(<ActivityInfoSummary activity={mockActivity} />)
        
        const titleElement = screen.getByText(mockActivity.title)
        expect(titleElement).toHaveClass('text-sm', 'font-medium')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      // Title should be accessible
      const titleElement = screen.getByText(mockActivity.title)
      expect(titleElement).toHaveAttribute('title', mockActivity.title)
      
      // Icons should be present for screen readers
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument()
    })

    it('should provide meaningful text content', () => {
      render(<ActivityInfo {...defaultProps} />)
      
      // All important information should be readable
      expect(screen.getByText(mockActivity.title)).toBeInTheDocument()
      expect(screen.getByText(mockActivity.type)).toBeInTheDocument()
      expect(screen.getByText(mockActivity.zone)).toBeInTheDocument()
      expect(screen.getByText(mockActivity.cameraName!)).toBeInTheDocument()
      expect(screen.getByText(/Assigned: Officer Johnson/)).toBeInTheDocument()
    })
  })
})
