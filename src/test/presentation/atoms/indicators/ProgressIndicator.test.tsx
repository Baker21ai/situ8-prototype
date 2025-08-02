import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  ProgressIndicator, 
  ProgressIndicatorProps,
  ConfidenceIndicator,
  RiskIndicator,
  PerformanceIndicator
} from '../../../../presentation/atoms/indicators/ProgressIndicator'

// Mock the Progress component
vi.mock('../../../../../components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      data-testid="progress-bar" 
      data-value={value}
      className={className}
      {...props}
    >
      <div 
        data-testid="progress-fill"
        style={{ width: `${value}%` }}
        className="progress-fill"
      />
    </div>
  )
}))

describe('ProgressIndicator', () => {
  const defaultProps: ProgressIndicatorProps = {
    value: 50
  }

  it('should render with default props', () => {
    render(<ProgressIndicator {...defaultProps} />)
    
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('data-value', '50')
  })

  it('should calculate percentage correctly', () => {
    render(<ProgressIndicator value={75} max={100} />)
    
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveAttribute('data-value', '75')
  })

  it('should handle custom max values', () => {
    render(<ProgressIndicator value={25} max={50} />)
    
    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveAttribute('data-value', '50') // 25/50 * 100 = 50%
  })

  describe('Value boundaries', () => {
    it('should cap percentage at 100%', () => {
      render(<ProgressIndicator value={150} max={100} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '100')
    })

    it('should floor percentage at 0%', () => {
      render(<ProgressIndicator value={-10} max={100} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '0')
    })

    it('should handle zero values', () => {
      render(<ProgressIndicator value={0} max={100} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '0')
    })

    it('should handle edge case of zero max', () => {
      render(<ProgressIndicator value={50} max={0} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '100') // Infinity capped at 100
    })
  })

  describe('Label display', () => {
    it('should display label when provided', () => {
      render(<ProgressIndicator {...defaultProps} label="Test Progress" />)
      
      expect(screen.getByText('Test Progress')).toBeInTheDocument()
    })

    it('should not display label when not provided', () => {
      render(<ProgressIndicator {...defaultProps} />)
      
      // Should not have any label text
      expect(screen.queryByText(/Progress/)).not.toBeInTheDocument()
    })

    it('should display label with proper styling', () => {
      render(<ProgressIndicator {...defaultProps} label="Custom Label" />)
      
      const label = screen.getByText('Custom Label')
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-gray-300')
    })
  })

  describe('Value display', () => {
    it('should show percentage value by default', () => {
      render(<ProgressIndicator value={75} label="Test" />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should hide percentage when showValue is false', () => {
      render(<ProgressIndicator value={75} label="Test" showValue={false} />)
      
      expect(screen.queryByText('75%')).not.toBeInTheDocument()
    })

    it('should round percentage values', () => {
      render(<ProgressIndicator value={33.7} max={100} label="Test" />)
      
      expect(screen.getByText('34%')).toBeInTheDocument()
    })

    it('should show value even without label when showValue=true', () => {
      render(<ProgressIndicator value={42} showValue={true} />)
      
      expect(screen.getByText('42%')).toBeInTheDocument()
    })
  })

  describe('Variant styling', () => {
    describe('Default variant', () => {
      it('should apply default (blue) styling', () => {
        render(<ProgressIndicator value={50} label="Test" variant="default" />)
        
        const valueText = screen.getByText('50%')
        expect(valueText).toHaveClass('text-blue-400')
      })
    })

    describe('Confidence variant', () => {
      it('should show green for high confidence (>=80%)', () => {
        render(<ProgressIndicator value={85} label="Test" variant="confidence" />)
        
        const valueText = screen.getByText('85%')
        expect(valueText).toHaveClass('text-green-400')
      })

      it('should show yellow for medium confidence (60-79%)', () => {
        render(<ProgressIndicator value={70} label="Test" variant="confidence" />)
        
        const valueText = screen.getByText('70%')
        expect(valueText).toHaveClass('text-yellow-400')
      })

      it('should show red for low confidence (<60%)', () => {
        render(<ProgressIndicator value={45} label="Test" variant="confidence" />)
        
        const valueText = screen.getByText('45%')
        expect(valueText).toHaveClass('text-red-400')
      })
    })

    describe('Risk variant', () => {
      it('should show red for high risk (>=80%)', () => {
        render(<ProgressIndicator value={90} label="Test" variant="risk" />)
        
        const valueText = screen.getByText('90%')
        expect(valueText).toHaveClass('text-red-400')
      })

      it('should show orange for medium risk (60-79%)', () => {
        render(<ProgressIndicator value={65} label="Test" variant="risk" />)
        
        const valueText = screen.getByText('65%')
        expect(valueText).toHaveClass('text-orange-400')
      })

      it('should show green for low risk (<60%)', () => {
        render(<ProgressIndicator value={30} label="Test" variant="risk" />)
        
        const valueText = screen.getByText('30%')
        expect(valueText).toHaveClass('text-green-400')
      })
    })

    describe('Performance variant', () => {
      it('should show green for excellent performance (>=90%)', () => {
        render(<ProgressIndicator value={95} label="Test" variant="performance" />)
        
        const valueText = screen.getByText('95%')
        expect(valueText).toHaveClass('text-green-400')
      })

      it('should show yellow for good performance (70-89%)', () => {
        render(<ProgressIndicator value={80} label="Test" variant="performance" />)
        
        const valueText = screen.getByText('80%')
        expect(valueText).toHaveClass('text-yellow-400')
      })

      it('should show red for poor performance (<70%)', () => {
        render(<ProgressIndicator value={60} label="Test" variant="performance" />)
        
        const valueText = screen.getByText('60%')
        expect(valueText).toHaveClass('text-red-400')
      })
    })
  })

  describe('Size variants', () => {
    it('should apply small size styles', () => {
      render(<ProgressIndicator {...defaultProps} size="sm" />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar.className).toContain('h-1.5')
    })

    it('should apply medium size styles (default)', () => {
      render(<ProgressIndicator {...defaultProps} size="md" />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar.className).toContain('h-2')
    })

    it('should apply large size styles', () => {
      render(<ProgressIndicator {...defaultProps} size="lg" />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar.className).toContain('h-3')
    })

    it('should default to medium size when not specified', () => {
      render(<ProgressIndicator {...defaultProps} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar.className).toContain('h-2')
    })
  })

  describe('Custom styling', () => {
    it('should apply custom className to container', () => {
      const customClass = 'custom-progress-class'
      render(<ProgressIndicator {...defaultProps} className={customClass} />)
      
      const container = screen.getByTestId('progress-bar').parentElement
      expect(container).toHaveClass(customClass)
    })

    it('should combine custom className with default container styles', () => {
      render(<ProgressIndicator {...defaultProps} className="mb-4" />)
      
      const container = screen.getByTestId('progress-bar').parentElement
      expect(container).toHaveClass('space-y-1', 'mb-4')
    })

    it('should apply background styles to progress bar', () => {
      render(<ProgressIndicator {...defaultProps} />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar.className).toContain('bg-gray-700')
    })
  })

  describe('Layout structure', () => {
    it('should have proper container structure', () => {
      render(<ProgressIndicator value={50} label="Test" />)
      
      const container = screen.getByTestId('progress-bar').parentElement
      expect(container).toHaveClass('space-y-1')
    })

    it('should have label row with proper flex layout', () => {
      render(<ProgressIndicator value={50} label="Test" />)
      
      const labelRow = screen.getByText('Test').parentElement
      expect(labelRow).toHaveClass('flex', 'items-center', 'justify-between')
    })

    it('should position value text correctly', () => {
      render(<ProgressIndicator value={50} label="Test" />)
      
      const valueText = screen.getByText('50%')
      expect(valueText).toHaveClass('text-sm', 'font-medium')
    })
  })

  describe('Specialized variant components', () => {
    describe('ConfidenceIndicator', () => {
      it('should render with confidence variant', () => {
        render(<ConfidenceIndicator value={85} />)
        
        expect(screen.getByText('Confidence')).toBeInTheDocument()
        const valueText = screen.getByText('85%')
        expect(valueText).toHaveClass('text-green-400') // High confidence
      })

      it('should use custom label when provided', () => {
        render(<ConfidenceIndicator value={75} label="AI Confidence" />)
        
        expect(screen.getByText('AI Confidence')).toBeInTheDocument()
        expect(screen.queryByText('Confidence')).not.toBeInTheDocument()
      })

      it('should forward all other props', () => {
        render(<ConfidenceIndicator value={90} size="lg" showValue={true} className="custom" />)
        
        const progressBar = screen.getByTestId('progress-bar')
        expect(progressBar.className).toContain('h-3') // lg size
        expect(progressBar.parentElement).toHaveClass('custom')
        expect(screen.getByText('90%')).toBeInTheDocument()
      })
    })

    describe('RiskIndicator', () => {
      it('should render with risk variant', () => {
        render(<RiskIndicator value={90} />)
        
        expect(screen.getByText('Risk Level')).toBeInTheDocument()
        const valueText = screen.getByText('90%')
        expect(valueText).toHaveClass('text-red-400') // High risk
      })

      it('should use custom label when provided', () => {
        render(<RiskIndicator value={30} label="Security Risk" />)
        
        expect(screen.getByText('Security Risk')).toBeInTheDocument()
        expect(screen.queryByText('Risk Level')).not.toBeInTheDocument()
      })
    })

    describe('PerformanceIndicator', () => {
      it('should render with performance variant', () => {
        render(<PerformanceIndicator value={95} />)
        
        expect(screen.getByText('Performance')).toBeInTheDocument()
        const valueText = screen.getByText('95%')
        expect(valueText).toHaveClass('text-green-400') // High performance
      })

      it('should use custom label when provided', () => {
        render(<PerformanceIndicator value={75} label="System Performance" />)
        
        expect(screen.getByText('System Performance')).toBeInTheDocument()
        expect(screen.queryByText('Performance')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper structure', () => {
      render(<ProgressIndicator value={75} label="Loading Progress" />)
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toBeInTheDocument()
      expect(screen.getByText('Loading Progress')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should maintain readability with all variants', () => {
      const variants = ['default', 'confidence', 'risk', 'performance'] as const
      const testValues = [25, 50, 75, 95]
      
      variants.forEach(variant => {
        testValues.forEach(value => {
          const { rerender } = render(
            <ProgressIndicator 
              value={value} 
              variant={variant} 
              label={`${variant} test`}
            />
          )
          
          expect(screen.getByText(`${variant} test`)).toBeInTheDocument()
          expect(screen.getByText(`${value}%`)).toBeInTheDocument()
          
          rerender(<div />)
        })
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle very small values', () => {
      render(<ProgressIndicator value={0.1} label="Test" />)
      
      expect(screen.getByText('0%')).toBeInTheDocument() // Rounded down
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '0.1')
    })

    it('should handle decimal max values', () => {
      render(<ProgressIndicator value={0.75} max={1.5} label="Test" />)
      
      expect(screen.getByText('50%')).toBeInTheDocument() // 0.75/1.5 = 0.5 = 50%
    })

    it('should handle missing label gracefully', () => {
      render(<ProgressIndicator value={50} showValue={true} />)
      
      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    })

    it('should handle negative max values', () => {
      render(<ProgressIndicator value={50} max={-100} label="Test" />)
      
      // Negative progress should be clamped to 0-100 range
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveAttribute('data-value', '0')
    })
  })
})
