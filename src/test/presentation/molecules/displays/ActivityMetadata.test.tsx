import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ActivityMetadata,
  ActivityMetadataProps,
  ActivityMetadataCompact,
  ActivityMetadataMinimal,
  ActivityMetadataInline
} from '../../../../presentation/molecules/displays/ActivityMetadata'
import {
  createMockActivity,
  createMockActivityWithFlags,
  createMockActivityWithExternalData
} from '../../../__mocks__/activityFactory'

// Mock dependencies
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <div data-testid="badge" className={className} data-variant={variant} {...props}>
      {children}
    </div>
  )
}))

vi.mock('../../../../presentation/atoms/badges/StatusBadge', () => ({
  StatusBadge: ({ priority, status, size, pulse, ...props }: any) => (
    <div 
      data-testid="status-badge" 
      data-priority={priority}
      data-status={status}
      data-size={size}
      data-pulse={pulse}
      {...props}
    >
      {priority}-{status}
    </div>
  )
}))

vi.mock('../../../../presentation/atoms/indicators/ProgressIndicator', () => ({
  ConfidenceIndicator: ({ value, showValue, size, ...props }: any) => (
    <div 
      data-testid="confidence-indicator" 
      data-value={value}
      data-show-value={showValue}
      data-size={size}
      {...props}
    >
      Confidence: {value}%{showValue ? ' (shown)' : ''}
    </div>
  )
}))

vi.mock('../../../../../lib/utils/status', () => ({
  getBusinessImpactColor: vi.fn((impact: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
      none: 'bg-gray-400'
    }
    return colors[impact] || 'bg-gray-400'
  })
}))

vi.mock('../../../../../components/ExternalDataDisplay', () => ({
  ExternalDataDisplay: ({ externalData, variant, className, ...props }: any) => (
    <div 
      data-testid="external-data-display" 
      data-variant={variant}
      className={className}
      {...props}
    >
      External Data: {externalData.source}
    </div>
  )
}))

describe('ActivityMetadata', () => {
  const mockActivity = createMockActivity()
  
  const defaultProps: ActivityMetadataProps = {
    activity: mockActivity
  }

  it('should render with default props', () => {
    render(<ActivityMetadata {...defaultProps} />)
    
    // Should show status badge
    expect(screen.getByTestId('status-badge')).toBeInTheDocument()
    
    // Should show confidence indicator
    expect(screen.getByTestId('confidence-indicator')).toBeInTheDocument()
  })

  describe('Priority and Status display', () => {
    it('should show status badge by default', () => {
      render(<ActivityMetadata {...defaultProps} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveAttribute('data-priority', mockActivity.priority)
      expect(statusBadge).toHaveAttribute('data-status', mockActivity.status)
      expect(statusBadge).toHaveAttribute('data-size', 'md')
    })

    it('should hide status badge when showPriority is false', () => {
      render(<ActivityMetadata {...defaultProps} showPriority={false} />)
      
      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument()
    })

    it('should apply pulse animation for critical priority', () => {
      const criticalActivity = createMockActivity({ priority: 'critical' })
      render(<ActivityMetadata activity={criticalActivity} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-pulse', 'true')
    })

    it('should not apply pulse animation for non-critical priorities', () => {
      const highActivity = createMockActivity({ priority: 'high' })
      render(<ActivityMetadata activity={highActivity} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-pulse', 'false')
    })
  })

  describe('Escalation display', () => {
    it('should show escalation badge when escalation level > 0', () => {
      const escalatedActivity = createMockActivity({ escalationLevel: 2 })
      render(<ActivityMetadata activity={escalatedActivity} />)
      
      const escalationBadge = screen.getByText('ESC 2')
      expect(escalationBadge).toBeInTheDocument()
      expect(escalationBadge.closest('[data-testid="badge"]')).toHaveClass('bg-purple-100', 'text-purple-800')
    })

    it('should not show escalation badge when escalation level is 0', () => {
      const nonEscalatedActivity = createMockActivity({ escalationLevel: 0 })
      render(<ActivityMetadata activity={nonEscalatedActivity} />)
      
      expect(screen.queryByText(/ESC/)).not.toBeInTheDocument()
    })

    it('should hide escalation when showEscalation is false', () => {
      const escalatedActivity = createMockActivity({ escalationLevel: 2 })
      render(<ActivityMetadata activity={escalatedActivity} showEscalation={false} />)
      
      expect(screen.queryByText('ESC 2')).not.toBeInTheDocument()
    })
  })

  describe('Business Impact display', () => {
    it('should show business impact indicator when impact is not none', () => {
      const impactActivity = createMockActivity({ businessImpact: 'high' })
      render(<ActivityMetadata activity={impactActivity} />)
      
      const impactIndicator = screen.getByTitle('Business Impact: high')
      expect(impactIndicator).toBeInTheDocument()
      expect(impactIndicator).toHaveClass('bg-orange-500')
    })

    it('should show impact label in full variant', () => {
      const impactActivity = createMockActivity({ businessImpact: 'medium' })
      render(<ActivityMetadata activity={impactActivity} variant="full" />)
      
      expect(screen.getByText('medium')).toBeInTheDocument()
    })

    it('should hide impact label in non-full variants', () => {
      const impactActivity = createMockActivity({ businessImpact: 'medium' })
      render(<ActivityMetadata activity={impactActivity} variant="compact" />)
      
      expect(screen.queryByText('medium')).not.toBeInTheDocument()
      // But indicator should still be present
      expect(screen.getByTitle('Business Impact: medium')).toBeInTheDocument()
    })

    it('should hide business impact when showBusinessImpact is false', () => {
      const impactActivity = createMockActivity({ businessImpact: 'high' })
      render(<ActivityMetadata activity={impactActivity} showBusinessImpact={false} />)
      
      expect(screen.queryByTitle(/Business Impact/)).not.toBeInTheDocument()
    })

    it('should not show business impact when impact is none', () => {
      const noneImpactActivity = createMockActivity({ businessImpact: 'none' })
      render(<ActivityMetadata activity={noneImpactActivity} />)
      
      expect(screen.queryByTitle(/Business Impact/)).not.toBeInTheDocument()
    })
  })

  describe('Confidence display', () => {
    it('should show confidence indicator in non-minimal variants', () => {
      render(<ActivityMetadata {...defaultProps} variant="full" />)
      
      const confidenceIndicator = screen.getByTestId('confidence-indicator')
      expect(confidenceIndicator).toBeInTheDocument()
      expect(confidenceIndicator).toHaveAttribute('data-value', mockActivity.confidence.toString())
      expect(confidenceIndicator).toHaveAttribute('data-show-value', 'true')
      expect(confidenceIndicator).toHaveAttribute('data-size', 'md')
    })

    it('should show confidence as badge in minimal variant', () => {
      render(<ActivityMetadata {...defaultProps} variant="minimal" />)
      
      expect(screen.queryByTestId('confidence-indicator')).not.toBeInTheDocument()
      const confidenceBadge = screen.getByText(`${mockActivity.confidence}%`)
      expect(confidenceBadge).toBeInTheDocument()
    })

    it('should hide confidence when showConfidence is false', () => {
      render(<ActivityMetadata {...defaultProps} showConfidence={false} />)
      
      expect(screen.queryByTestId('confidence-indicator')).not.toBeInTheDocument()
      expect(screen.queryByText(`${mockActivity.confidence}%`)).not.toBeInTheDocument()
    })

    it('should adjust confidence indicator size for compact variant', () => {
      render(<ActivityMetadata {...defaultProps} variant="compact" />)
      
      const confidenceIndicator = screen.getByTestId('confidence-indicator')
      expect(confidenceIndicator).toHaveAttribute('data-size', 'sm')
      expect(confidenceIndicator).toHaveAttribute('data-show-value', 'false')
    })
  })

  describe('Special badges display', () => {
    it('should show NEW badge when activity is new', () => {
      const newActivity = createMockActivityWithFlags({ isNewActivity: true })
      render(<ActivityMetadata activity={newActivity} />)
      
      const newBadge = screen.getByText('NEW')
      expect(newBadge).toBeInTheDocument()
      expect(newBadge.closest('[data-testid="badge"]')).toHaveClass('bg-red-100', 'text-red-800', 'animate-pulse')
    })

    it('should show BOLO badge when BOLO is active', () => {
      const boloActivity = createMockActivityWithFlags({ isBoloActive: true })
      render(<ActivityMetadata activity={boloActivity} />)
      
      const boloBadge = screen.getByText('BOLO')
      expect(boloBadge).toBeInTheDocument()
      expect(boloBadge.closest('[data-testid="badge"]')).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('should show MASS CASUALTY badge when applicable', () => {
      const massCasualtyActivity = createMockActivityWithFlags({ isMassCasualty: true })
      render(<ActivityMetadata activity={massCasualtyActivity} />)
      
      const massCasualtyBadge = screen.getByText('MASS CASUALTY')
      expect(massCasualtyBadge).toBeInTheDocument()
      expect(massCasualtyBadge.closest('[data-testid="badge"]')).toHaveClass('bg-red-100', 'text-red-800', 'animate-pulse')
    })

    it('should show SECURITY THREAT badge when applicable', () => {
      const threatActivity = createMockActivityWithFlags({ isSecurityThreat: true })
      render(<ActivityMetadata activity={threatActivity} />)
      
      const threatBadge = screen.getByText('SECURITY THREAT')
      expect(threatBadge).toBeInTheDocument()
      expect(threatBadge.closest('[data-testid="badge"]')).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('should hide special badges when showSpecialBadges is false', () => {
      const specialActivity = createMockActivityWithFlags({ 
        isNewActivity: true, 
        isBoloActive: true,
        isMassCasualty: true,
        isSecurityThreat: true
      })
      render(<ActivityMetadata activity={specialActivity} showSpecialBadges={false} />)
      
      expect(screen.queryByText('NEW')).not.toBeInTheDocument()
      expect(screen.queryByText('BOLO')).not.toBeInTheDocument()
      expect(screen.queryByText('MASS CASUALTY')).not.toBeInTheDocument()
      expect(screen.queryByText('SECURITY THREAT')).not.toBeInTheDocument()
    })

    it('should show minimal indicators in minimal variant', () => {
      const specialActivity = createMockActivityWithFlags({ 
        isNewActivity: true, 
        isBoloActive: true
      })
      render(<ActivityMetadata activity={specialActivity} variant="minimal" />)
      
      // Should show dot indicators instead of badges
      const newIndicator = screen.getByTitle('New Activity')
      const boloIndicator = screen.getByTitle('BOLO Active')
      
      expect(newIndicator).toBeInTheDocument()
      expect(newIndicator).toHaveClass('w-1.5', 'h-1.5', 'bg-red-500', 'animate-pulse')
      expect(boloIndicator).toBeInTheDocument()
      expect(boloIndicator).toHaveClass('w-1.5', 'h-1.5', 'bg-orange-500')
    })
  })

  describe('External data display', () => {
    it('should show external data when available', () => {
      const externalDataActivity = createMockActivityWithExternalData()
      render(<ActivityMetadata activity={externalDataActivity} />)
      
      const externalDataDisplay = screen.getByTestId('external-data-display')
      expect(externalDataDisplay).toBeInTheDocument()
      expect(externalDataDisplay).toHaveAttribute('data-variant', 'compact')
    })

    it('should adjust external data variant based on metadata variant', () => {
      const externalDataActivity = createMockActivityWithExternalData()
      render(<ActivityMetadata activity={externalDataActivity} variant="compact" />)
      
      const externalDataDisplay = screen.getByTestId('external-data-display')
      expect(externalDataDisplay).toHaveAttribute('data-variant', 'inline')
    })

    it('should hide external data when showExternalData is false', () => {
      const externalDataActivity = createMockActivityWithExternalData()
      render(<ActivityMetadata activity={externalDataActivity} showExternalData={false} />)
      
      expect(screen.queryByTestId('external-data-display')).not.toBeInTheDocument()
    })
  })

  describe('Variant styling', () => {
    it('should use appropriate badge size for each variant', () => {
      const { rerender } = render(<ActivityMetadata {...defaultProps} variant="minimal" />)
      
      let statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-size', 'sm')
      
      rerender(<ActivityMetadata {...defaultProps} variant="compact" />)
      statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-size', 'sm')
      
      rerender(<ActivityMetadata {...defaultProps} variant="full" />)
      statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-size', 'md')
    })

    it('should apply appropriate spacing for each variant', () => {
      const { container, rerender } = render(<ActivityMetadata {...defaultProps} variant="minimal" />)
      expect(container.querySelector('.gap-0\.5')).toBeInTheDocument()
      
      rerender(<ActivityMetadata {...defaultProps} variant="compact" />)
      expect(container.querySelector('.gap-1')).toBeInTheDocument()
      
      rerender(<ActivityMetadata {...defaultProps} variant="full" />)
      expect(container.querySelector('.gap-2')).toBeInTheDocument()
    })

    it('should apply appropriate text size for each variant', () => {
      const escalatedActivity = createMockActivity({ escalationLevel: 1 })
      const { rerender } = render(<ActivityMetadata activity={escalatedActivity} variant="minimal" />)
      
      let escalationBadge = screen.getByText('ESC 1').closest('[data-testid="badge"]')
      expect(escalationBadge).toHaveClass('text-xs')
      
      rerender(<ActivityMetadata activity={escalatedActivity} variant="full" />)
      escalationBadge = screen.getByText('ESC 1').closest('[data-testid="badge"]')
      expect(escalationBadge).toHaveClass('text-sm')
    })
  })

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-metadata-class'
      const { container } = render(<ActivityMetadata {...defaultProps} className={customClass} />)
      
      expect(container.firstChild).toHaveClass(customClass)
    })
  })

  describe('Specialized variant components', () => {
    describe('ActivityMetadataCompact', () => {
      it('should render with compact variant', () => {
        render(<ActivityMetadataCompact activity={mockActivity} />)
        
        const statusBadge = screen.getByTestId('status-badge')
        expect(statusBadge).toHaveAttribute('data-size', 'sm')
        
        const confidenceIndicator = screen.getByTestId('confidence-indicator')
        expect(confidenceIndicator).toHaveAttribute('data-size', 'sm')
        expect(confidenceIndicator).toHaveAttribute('data-show-value', 'false')
      })
    })

    describe('ActivityMetadataMinimal', () => {
      it('should render with minimal variant', () => {
        render(<ActivityMetadataMinimal activity={mockActivity} />)
        
        const statusBadge = screen.getByTestId('status-badge')
        expect(statusBadge).toHaveAttribute('data-size', 'sm')
        
        // Should show confidence as badge instead of indicator
        expect(screen.queryByTestId('confidence-indicator')).not.toBeInTheDocument()
        expect(screen.getByText(`${mockActivity.confidence}%`)).toBeInTheDocument()
      })
    })

    describe('ActivityMetadataInline', () => {
      it('should render with inline variant', () => {
        render(<ActivityMetadataInline activity={mockActivity} />)
        
        const statusBadge = screen.getByTestId('status-badge')
        expect(statusBadge).toBeInTheDocument()
      })
    })

    it('should forward all props except variant', () => {
      render(
        <ActivityMetadataCompact 
          activity={mockActivity} 
          showPriority={false}
          className="custom-compact"
        />
      )
      
      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('should have proper primary metadata row', () => {
      const { container } = render(<ActivityMetadata {...defaultProps} />)
      
      const primaryRow = container.querySelector('.flex.items-center.justify-between')
      expect(primaryRow).toBeInTheDocument()
    })

    it('should show special badges in separate row for non-minimal variants', () => {
      const specialActivity = createMockActivityWithFlags({ isNewActivity: true })
      render(<ActivityMetadata activity={specialActivity} variant="full" />)
      
      // Special badges should be in a separate row with mt-1
      const specialBadgesRow = screen.getByText('NEW').closest('.mt-1')
      expect(specialBadgesRow).toBeInTheDocument()
    })

    it('should show external data in separate section', () => {
      const externalDataActivity = createMockActivityWithExternalData()
      render(<ActivityMetadata activity={externalDataActivity} />)
      
      const externalDataSection = screen.getByTestId('external-data-display').closest('.mt-2')
      expect(externalDataSection).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle activity without confidence', () => {
      const noConfidenceActivity = createMockActivity({ confidence: undefined })
      render(<ActivityMetadata activity={noConfidenceActivity} />)
      
      expect(screen.queryByTestId('confidence-indicator')).not.toBeInTheDocument()
      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })

    it('should handle activity without business impact', () => {
      const noImpactActivity = createMockActivity({ businessImpact: undefined })
      render(<ActivityMetadata activity={noImpactActivity} />)
      
      expect(screen.queryByTitle(/Business Impact/)).not.toBeInTheDocument()
    })

    it('should handle activity without external data', () => {
      const noExternalDataActivity = createMockActivity({ externalData: undefined })
      render(<ActivityMetadata activity={noExternalDataActivity} />)
      
      expect(screen.queryByTestId('external-data-display')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper titles for indicators', () => {
      const impactActivity = createMockActivity({ businessImpact: 'high' })
      render(<ActivityMetadata activity={impactActivity} />)
      
      const businessImpactIndicator = screen.getByTitle('Business Impact: high')
      expect(businessImpactIndicator).toBeInTheDocument()
    })

    it('should have meaningful titles for minimal indicators', () => {
      const specialActivity = createMockActivityWithFlags({ 
        isNewActivity: true, 
        isBoloActive: true,
        isMassCasualty: true,
        isSecurityThreat: true
      })
      render(<ActivityMetadata activity={specialActivity} variant="minimal" />)
      
      expect(screen.getByTitle('New Activity')).toBeInTheDocument()
      expect(screen.getByTitle('BOLO Active')).toBeInTheDocument()
      expect(screen.getByTitle('Mass Casualty')).toBeInTheDocument()
      expect(screen.getByTitle('Security Threat')).toBeInTheDocument()
    })
  })
})
