import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  ActionButton, 
  ActionButtonProps,
  ActionButtonCritical,
  ActionButtonWarning,
  ActionButtonSuccess,
  ActionButtonSecondary
} from '../../../../presentation/atoms/buttons/ActionButton'
import { AlertTriangle, User, CheckCircle } from 'lucide-react'

// Mock the UI components and framer-motion (already mocked in setup.ts)
vi.mock('../../../../../components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, ...props }: any) => (
    <button 
      data-testid="action-button" 
      className={className} 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}))

describe('ActionButton', () => {
  const user = userEvent.setup()
  const mockOnClick = vi.fn()
  const testIcon = <AlertTriangle data-testid="test-icon" />

  const defaultProps: ActionButtonProps = {
    variant: 'secondary',
    icon: testIcon,
    children: 'Test Button',
    onClick: mockOnClick
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default props', () => {
    render(<ActionButton {...defaultProps} />)
    
    const button = screen.getByTestId('action-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Test Button')
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should display children content', () => {
    render(<ActionButton {...defaultProps}>Custom Content</ActionButton>)
    
    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })

  describe('Variant styling', () => {
    it('should apply critical variant styles', () => {
      render(<ActionButton {...defaultProps} variant="critical" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('bg-red-600')
      expect(button.className).toContain('hover:bg-red-700')
      expect(button.className).toContain('text-white')
      expect(button.className).toContain('shadow-lg')
      expect(button.className).toContain('shadow-red-600/30')
      expect(button.className).toContain('ring-red-500/50')
    })

    it('should apply warning variant styles', () => {
      render(<ActionButton {...defaultProps} variant="warning" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('bg-orange-600')
      expect(button.className).toContain('hover:bg-orange-700')
      expect(button.className).toContain('text-white')
      expect(button.className).toContain('shadow-orange-600/30')
    })

    it('should apply success variant styles', () => {
      render(<ActionButton {...defaultProps} variant="success" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('bg-green-600')
      expect(button.className).toContain('hover:bg-green-700')
      expect(button.className).toContain('text-white')
      expect(button.className).toContain('shadow-green-600/30')
    })

    it('should apply secondary variant styles (default)', () => {
      render(<ActionButton {...defaultProps} variant="secondary" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('bg-gray-700')
      expect(button.className).toContain('hover:bg-gray-600')
      expect(button.className).toContain('text-gray-200')
      expect(button.className).toContain('border')
      expect(button.className).toContain('border-gray-600')
    })
  })

  describe('Size variants', () => {
    it('should apply small size styles', () => {
      render(<ActionButton {...defaultProps} size="sm" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('h-8')
      expect(button.className).toContain('text-sm')
      expect(button.className).toContain('px-3')
    })

    it('should apply medium size styles (default)', () => {
      render(<ActionButton {...defaultProps} size="md" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('h-10')
      expect(button.className).toContain('text-base')
      expect(button.className).toContain('px-4')
    })

    it('should apply large size styles', () => {
      render(<ActionButton {...defaultProps} size="lg" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('h-12')
      expect(button.className).toContain('text-lg')
      expect(button.className).toContain('px-6')
    })

    it('should default to medium size when not specified', () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('h-10')
      expect(button.className).toContain('text-base')
      expect(button.className).toContain('px-4')
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner when loading', () => {
      render(<ActionButton {...defaultProps} loading={true} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeDisabled()
      
      // Check for loading spinner (Loader2 component)
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should show icon when not loading', () => {
      render(<ActionButton {...defaultProps} loading={false} />)
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    })

    it('should disable button when loading', () => {
      render(<ActionButton {...defaultProps} loading={true} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeDisabled()
    })

    it('should not trigger onClick when loading', async () => {
      render(<ActionButton {...defaultProps} loading={true} />)
      
      const button = screen.getByTestId('action-button')
      await user.click(button)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<ActionButton {...defaultProps} disabled={true} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeDisabled()
    })

    it('should apply disabled styles', () => {
      render(<ActionButton {...defaultProps} disabled={true} />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('disabled:opacity-50')
      expect(button.className).toContain('disabled:cursor-not-allowed')
    })

    it('should not trigger onClick when disabled', async () => {
      render(<ActionButton {...defaultProps} disabled={true} />)
      
      const button = screen.getByTestId('action-button')
      await user.click(button)
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Click interactions', () => {
    it('should call onClick when clicked', async () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      await user.click(button)
      
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple clicks', async () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      await user.click(button)
      await user.click(button)
      
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('should work without onClick handler', async () => {
      render(<ActionButton {...defaultProps} onClick={undefined} />)
      
      const button = screen.getByTestId('action-button')
      
      // Should not throw error
      await user.click(button)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-button-class'
      render(<ActionButton {...defaultProps} className={customClass} />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain(customClass)
    })

    it('should combine custom className with variant styles', () => {
      render(<ActionButton {...defaultProps} className="border-2" variant="critical" />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('border-2')
      expect(button.className).toContain('bg-red-600')
    })
  })

  describe('Common styling classes', () => {
    it('should always include base styling classes', () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('font-semibold')
      expect(button.className).toContain('transition-all')
      expect(button.className).toContain('duration-200')
      expect(button.className).toContain('focus:ring-2')
      expect(button.className).toContain('focus:ring-offset-2')
      expect(button.className).toContain('focus:ring-offset-gray-900')
    })
  })

  describe('Icon display', () => {
    it('should display icon when provided', () => {
      const icon = <User data-testid="user-icon" />
      render(<ActionButton {...defaultProps} icon={icon} />)
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })

    it('should show icon with margin', () => {
      render(<ActionButton {...defaultProps} />)
      
      const iconContainer = screen.getByTestId('test-icon').parentElement
      expect(iconContainer).toHaveClass('mr-2')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      
      // Focus the button
      button.focus()
      expect(button).toHaveFocus()
      
      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalled()
      })
    })

    it('should have proper focus states', () => {
      render(<ActionButton {...defaultProps} />)
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('focus:ring-2')
      expect(button.className).toContain('focus:ring-offset-2')
    })

    it('should maintain proper contrast for all variants', () => {
      const variants = ['critical', 'warning', 'success', 'secondary'] as const
      
      variants.forEach(variant => {
        const { rerender } = render(<ActionButton {...defaultProps} variant={variant} />)
        
        const button = screen.getByTestId('action-button')
        expect(button).toBeVisible()
        expect(button).toHaveTextContent('Test Button')
        
        rerender(<div />)
      })
    })
  })

  describe('Motion wrapper', () => {
    it('should wrap button in motion.div (mocked)', () => {
      render(<ActionButton {...defaultProps} />)
      
      // Since motion is mocked, we just verify the button renders correctly
      const button = screen.getByTestId('action-button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Specialized variant components', () => {
    it('should render ActionButtonCritical with critical variant', () => {
      render(<ActionButtonCritical icon={testIcon} onClick={mockOnClick}>Critical Action</ActionButtonCritical>)
      
      const button = screen.getByTestId('action-button')
      expect(button).toHaveTextContent('Critical Action')
      expect(button.className).toContain('bg-red-600')
    })

    it('should render ActionButtonWarning with warning variant', () => {
      render(<ActionButtonWarning icon={testIcon} onClick={mockOnClick}>Warning Action</ActionButtonWarning>)
      
      const button = screen.getByTestId('action-button')
      expect(button).toHaveTextContent('Warning Action')
      expect(button.className).toContain('bg-orange-600')
    })

    it('should render ActionButtonSuccess with success variant', () => {
      render(<ActionButtonSuccess icon={testIcon} onClick={mockOnClick}>Success Action</ActionButtonSuccess>)
      
      const button = screen.getByTestId('action-button')
      expect(button).toHaveTextContent('Success Action')
      expect(button.className).toContain('bg-green-600')
    })

    it('should render ActionButtonSecondary with secondary variant', () => {
      render(<ActionButtonSecondary icon={testIcon} onClick={mockOnClick}>Secondary Action</ActionButtonSecondary>)
      
      const button = screen.getByTestId('action-button')
      expect(button).toHaveTextContent('Secondary Action')
      expect(button.className).toContain('bg-gray-700')
    })

    it('should forward all props to specialized components', async () => {
      render(
        <ActionButtonCritical 
          icon={testIcon} 
          onClick={mockOnClick}
          size="lg"
          disabled={false}
          loading={false}
          className="custom-class"
        >
          Test
        </ActionButtonCritical>
      )
      
      const button = screen.getByTestId('action-button')
      expect(button.className).toContain('h-12') // lg size
      expect(button.className).toContain('custom-class')
      expect(button).not.toBeDisabled()
      
      await user.click(button)
      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing icon gracefully', () => {
      render(<ActionButton {...defaultProps} icon={null} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Test Button')
    })

    it('should handle empty children', () => {
      render(<ActionButton {...defaultProps} children={null} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeInTheDocument()
    })

    it('should handle both loading and disabled states', () => {
      render(<ActionButton {...defaultProps} loading={true} disabled={true} />)
      
      const button = screen.getByTestId('action-button')
      expect(button).toBeDisabled()
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })
})
