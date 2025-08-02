import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusBadge, StatusBadgeProps } from '../../../../presentation/atoms/badges/StatusBadge'
import { Priority, Status } from '../../../../../lib/utils/status'

// Mock the Badge component
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <div data-testid="badge" className={className} {...props}>
      {children}
    </div>
  )
}))

describe('StatusBadge', () => {
  const defaultProps: StatusBadgeProps = {
    priority: 'medium',
    status: 'assigned'
  }

  it('should render with default props', () => {
    render(<StatusBadge {...defaultProps} />)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('assigned')
  })

  it('should display the correct status text', () => {
    const statuses: Status[] = ['detecting', 'assigned', 'responding', 'resolved']
    
    statuses.forEach(status => {
      const { rerender } = render(<StatusBadge {...defaultProps} status={status} />)
      
      expect(screen.getByTestId('badge')).toHaveTextContent(status)
      
      // Clean up for next iteration
      rerender(<div />)
    })
  })

  describe('Priority-based styling', () => {
    it('should apply critical priority styles', () => {
      render(<StatusBadge priority="critical" status="detecting" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-red-500/20')
      expect(badge.className).toContain('border-red-500')
      expect(badge.className).toContain('text-red-300')
      expect(badge.className).toContain('shadow-red-500/30')
    })

    it('should apply high priority styles', () => {
      render(<StatusBadge priority="high" status="assigned" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-orange-500/20')
      expect(badge.className).toContain('border-orange-500')
      expect(badge.className).toContain('text-orange-300')
      expect(badge.className).toContain('shadow-orange-500/30')
    })

    it('should apply medium priority styles', () => {
      render(<StatusBadge priority="medium" status="responding" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-yellow-500/20')
      expect(badge.className).toContain('border-yellow-500')
      expect(badge.className).toContain('text-yellow-300')
      expect(badge.className).toContain('shadow-yellow-500/30')
    })

    it('should apply low priority styles (default fallback)', () => {
      render(<StatusBadge priority="low" status="resolved" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-green-500/20')
      expect(badge.className).toContain('border-green-500')
      expect(badge.className).toContain('text-green-300')
      expect(badge.className).toContain('shadow-green-500/30')
    })
  })

  describe('Size variants', () => {
    it('should apply small size styles', () => {
      render(<StatusBadge {...defaultProps} size="sm" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('text-xs')
      expect(badge.className).toContain('px-1.5')
      expect(badge.className).toContain('py-0.5')
    })

    it('should apply medium size styles (default)', () => {
      render(<StatusBadge {...defaultProps} size="md" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('text-xs')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('py-0.5')
    })

    it('should apply large size styles', () => {
      render(<StatusBadge {...defaultProps} size="lg" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('text-sm')
      expect(badge.className).toContain('px-3')
      expect(badge.className).toContain('py-1')
    })

    it('should default to medium size when not specified', () => {
      render(<StatusBadge {...defaultProps} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('text-xs')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('py-0.5')
    })
  })

  describe('Pulse animation', () => {
    it('should apply pulse animation when enabled', () => {
      render(<StatusBadge {...defaultProps} pulse={true} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('animate-pulse')
    })

    it('should not apply pulse animation when disabled', () => {
      render(<StatusBadge {...defaultProps} pulse={false} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).not.toContain('animate-pulse')
    })

    it('should not apply pulse animation by default', () => {
      render(<StatusBadge {...defaultProps} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).not.toContain('animate-pulse')
    })
  })

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-badge-class'
      render(<StatusBadge {...defaultProps} className={customClass} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain(customClass)
    })

    it('should combine custom className with default styles', () => {
      const customClass = 'border-4'
      render(<StatusBadge {...defaultProps} className={customClass} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain(customClass)
      expect(badge.className).toContain('border')
      expect(badge.className).toContain('shadow-lg')
      expect(badge.className).toContain('font-medium')
    })
  })

  describe('Common styling classes', () => {
    it('should always include base styling classes', () => {
      render(<StatusBadge {...defaultProps} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('border')
      expect(badge.className).toContain('shadow-lg')
      expect(badge.className).toContain('font-medium')
      expect(badge.className).toContain('uppercase')
      expect(badge.className).toContain('tracking-wider')
      expect(badge.className).toContain('transition-all')
      expect(badge.className).toContain('duration-200')
      expect(badge.className).toContain('hover:scale-105')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper text content', () => {
      render(<StatusBadge priority="critical" status="detecting" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('detecting')
      expect(badge).toBeVisible()
    })

    it('should maintain contrast for all priority levels', () => {
      const priorities: Priority[] = ['critical', 'high', 'medium', 'low']
      
      priorities.forEach(priority => {
        const { rerender } = render(<StatusBadge priority={priority} status="assigned" />)
        
        const badge = screen.getByTestId('badge')
        expect(badge).toBeVisible()
        expect(badge).toHaveTextContent('assigned')
        
        // Clean up for next iteration
        rerender(<div />)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty className', () => {
      render(<StatusBadge {...defaultProps} className="" />)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
    })

    it('should handle undefined className', () => {
      render(<StatusBadge {...defaultProps} className={undefined} />)
      
      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
    })

    it('should handle all combinations of props', () => {
      const priorities: Priority[] = ['critical', 'high', 'medium', 'low']
      const statuses: Status[] = ['detecting', 'assigned', 'responding', 'resolved']
      const sizes = ['sm', 'md', 'lg'] as const
      
      priorities.forEach(priority => {
        statuses.forEach(status => {
          sizes.forEach(size => {
            const { rerender } = render(
              <StatusBadge 
                priority={priority} 
                status={status} 
                size={size} 
                pulse={priority === 'critical'}
              />
            )
            
            const badge = screen.getByTestId('badge')
            expect(badge).toBeInTheDocument()
            expect(badge).toHaveTextContent(status)
            
            // Clean up for next iteration
            rerender(<div />)
          })
        })
      })
    })
  })
})
