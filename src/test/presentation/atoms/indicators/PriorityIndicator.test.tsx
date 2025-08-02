import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  PriorityIndicator, 
  PriorityIndicatorIcon,
  PriorityIndicatorDot,
  PriorityIndicatorText,
  PriorityIndicatorCombined,
  PriorityIndicatorProps 
} from '../../../../presentation/atoms/indicators/PriorityIndicator';
import { Priority } from '../../../../../lib/utils/status';

// Mock the Badge component
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <div data-testid="priority-badge" className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }: any) => (
    <div data-testid="alert-triangle-icon" className={className} {...props} />
  ),
  AlertCircle: ({ className, ...props }: any) => (
    <div data-testid="alert-circle-icon" className={className} {...props} />
  ),
  Info: ({ className, ...props }: any) => (
    <div data-testid="info-icon" className={className} {...props} />
  ),
  CheckCircle: ({ className, ...props }: any) => (
    <div data-testid="check-circle-icon" className={className} {...props} />
  ),
}));

describe('PriorityIndicator', () => {
  const defaultProps: PriorityIndicatorProps = {
    priority: 'medium'
  };

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<PriorityIndicator {...defaultProps} />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Medium');
    });

    it('should render all priority levels correctly', () => {
      const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
      const expectedLabels = ['Critical', 'High', 'Medium', 'Low'];
      
      priorities.forEach((priority, index) => {
        const { rerender } = render(<PriorityIndicator priority={priority} />);
        
        const indicator = screen.getByTestId('priority-badge');
        expect(indicator).toHaveTextContent(expectedLabels[index]);
        
        rerender(<div />);
      });
    });
  });

  describe('Priority-based styling', () => {
    it('should apply critical priority styles', () => {
      render(<PriorityIndicator priority="critical" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('bg-red-500/20');
      expect(indicator.className).toContain('border-red-500');
      expect(indicator.className).toContain('text-red-300');
    });

    it('should apply high priority styles', () => {
      render(<PriorityIndicator priority="high" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('bg-orange-500/20');
      expect(indicator.className).toContain('border-orange-500');
      expect(indicator.className).toContain('text-orange-300');
    });

    it('should apply medium priority styles', () => {
      render(<PriorityIndicator priority="medium" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('bg-yellow-500/20');
      expect(indicator.className).toContain('border-yellow-500');
      expect(indicator.className).toContain('text-yellow-300');
    });

    it('should apply low priority styles', () => {
      render(<PriorityIndicator priority="low" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('bg-green-500/20');
      expect(indicator.className).toContain('border-green-500');
      expect(indicator.className).toContain('text-green-300');
    });
  });

  describe('Size variants', () => {
    it('should apply extra small size styles', () => {
      render(<PriorityIndicator {...defaultProps} size="xs" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('text-xs');
      expect(indicator.className).toContain('px-1');
      expect(indicator.className).toContain('py-0.5');
    });

    it('should apply small size styles (default)', () => {
      render(<PriorityIndicator {...defaultProps} size="sm" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('text-xs');
      expect(indicator.className).toContain('px-1.5');
      expect(indicator.className).toContain('py-0.5');
    });

    it('should apply medium size styles', () => {
      render(<PriorityIndicator {...defaultProps} size="md" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('text-sm');
      expect(indicator.className).toContain('px-2');
      expect(indicator.className).toContain('py-1');
    });

    it('should apply large size styles', () => {
      render(<PriorityIndicator {...defaultProps} size="lg" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('text-base');
      expect(indicator.className).toContain('px-3');
      expect(indicator.className).toContain('py-1.5');
    });

    it('should apply extra large size styles', () => {
      render(<PriorityIndicator {...defaultProps} size="xl" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('text-lg');
      expect(indicator.className).toContain('px-4');
      expect(indicator.className).toContain('py-2');
    });
  });

  describe('Variant types', () => {
    it('should render badge variant (default)', () => {
      render(<PriorityIndicator {...defaultProps} variant="badge" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Medium');
    });

    it('should render icon variant with icon and label', () => {
      render(<PriorityIndicator priority="critical" variant="icon" />);
      
      const icon = screen.getByTestId('alert-triangle-icon');
      const text = screen.getByText('Critical');
      
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('should render icon variant without label when showLabel is false', () => {
      render(<PriorityIndicator priority="critical" variant="icon" showLabel={false} />);
      
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toBeInTheDocument();
      expect(screen.queryByText('Critical')).not.toBeInTheDocument();
    });

    it('should render dot variant', () => {
      render(<PriorityIndicator priority="high" variant="dot" />);
      
      const container = screen.getByText('High').parentElement;
      expect(container).toBeInTheDocument();
      
      // Check for dot element (div with rounded-full)
      const dotElement = container?.querySelector('div[class*="rounded-full"]');
      expect(dotElement).toBeInTheDocument();
    });

    it('should render text variant', () => {
      render(<PriorityIndicator priority="low" variant="text" />);
      
      const textElement = screen.getByText('Low');
      expect(textElement).toBeInTheDocument();
      expect(textElement.className).toContain('font-medium');
      expect(textElement.className).toContain('uppercase');
    });

    it('should render combined variant with icon and text', () => {
      render(<PriorityIndicator priority="medium" variant="combined" />);
      
      const indicator = screen.getByTestId('priority-badge');
      const icon = screen.getByTestId('info-icon');
      
      expect(indicator).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Medium');
    });
  });

  describe('Animation', () => {
    it('should apply pulse animation when animated is true', () => {
      render(<PriorityIndicator {...defaultProps} animated={true} />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain('animate-pulse');
    });

    it('should apply pulse animation for critical priority by default', () => {
      render(<PriorityIndicator priority="critical" />);
      
      const container = screen.getByText('Critical').parentElement;
      expect(container?.className).toContain('animate-pulse');
    });

    it('should not apply pulse animation for non-critical priorities by default', () => {
      render(<PriorityIndicator priority="low" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).not.toContain('animate-pulse');
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-priority-class';
      render(<PriorityIndicator {...defaultProps} className={customClass} />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain(customClass);
    });

    it('should combine custom className with default styles', () => {
      const customClass = 'border-4';
      render(<PriorityIndicator {...defaultProps} className={customClass} />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator.className).toContain(customClass);
      expect(indicator.className).toContain('border');
      expect(indicator.className).toContain('font-medium');
    });
  });

  describe('Icon mapping', () => {
    it('should use AlertTriangle icon for critical priority', () => {
      render(<PriorityIndicator priority="critical" variant="icon" />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should use AlertCircle icon for high priority', () => {
      render(<PriorityIndicator priority="high" variant="icon" />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should use Info icon for medium priority', () => {
      render(<PriorityIndicator priority="medium" variant="icon" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should use CheckCircle icon for low priority', () => {
      render(<PriorityIndicator priority="low" variant="icon" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for icon variant', () => {
      render(<PriorityIndicator priority="critical" variant="icon" />);
      
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveAttribute('aria-label', 'Critical priority');
    });

    it('should have proper aria-label for dot variant', () => {
      render(<PriorityIndicator priority="high" variant="dot" />);
      
      const container = screen.getByText('High').parentElement;
      const dotElement = container?.querySelector('div[aria-label="High priority"]');
      expect(dotElement).toBeInTheDocument();
    });

    it('should have proper aria-label for text variant', () => {
      render(<PriorityIndicator priority="low" variant="text" />);
      
      const textElement = screen.getByText('Low');
      expect(textElement).toHaveAttribute('aria-label', 'Low priority');
    });

    it('should be accessible with screen readers', () => {
      render(<PriorityIndicator priority="critical" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator).toHaveTextContent('Critical');
      expect(indicator).toBeVisible();
    });
  });

  describe('Specialized variants', () => {
    it('should render PriorityIndicatorIcon correctly', () => {
      render(<PriorityIndicatorIcon priority="critical" />);
      
      const icon = screen.getByTestId('alert-triangle-icon');
      const text = screen.getByText('Critical');
      
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('should render PriorityIndicatorDot correctly', () => {
      render(<PriorityIndicatorDot priority="high" />);
      
      const container = screen.getByText('High').parentElement;
      const dotElement = container?.querySelector('div[class*="rounded-full"]');
      expect(dotElement).toBeInTheDocument();
    });

    it('should render PriorityIndicatorText correctly', () => {
      render(<PriorityIndicatorText priority="medium" />);
      
      const textElement = screen.getByText('Medium');
      expect(textElement).toBeInTheDocument();
      expect(textElement.className).toContain('uppercase');
    });

    it('should render PriorityIndicatorCombined correctly', () => {
      render(<PriorityIndicatorCombined priority="low" />);
      
      const indicator = screen.getByTestId('priority-badge');
      const icon = screen.getByTestId('check-circle-icon');
      
      expect(indicator).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Low');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty className', () => {
      render(<PriorityIndicator {...defaultProps} className="" />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      render(<PriorityIndicator {...defaultProps} className={undefined} />);
      
      const indicator = screen.getByTestId('priority-badge');
      expect(indicator).toBeInTheDocument();
    });

    it('should work with all combinations of props', () => {
      const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
      const variants = ['badge', 'icon', 'dot', 'text', 'combined'] as const;
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      
      priorities.forEach(priority => {
        variants.forEach(variant => {
          sizes.forEach(size => {
            const { rerender } = render(
              <PriorityIndicator 
                priority={priority} 
                variant={variant}
                size={size}
                animated={priority === 'critical'}
                showLabel={true}
              />
            );
            
            // Basic smoke test - component should render without errors
            if (variant === 'badge' || variant === 'combined') {
              expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
            }
            
            rerender(<div />);
          });
        });
      });
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for default variant', () => {
      const { container } = render(<PriorityIndicator priority="medium" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for icon variant', () => {
      const { container } = render(<PriorityIndicator priority="critical" variant="icon" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for dot variant', () => {
      const { container } = render(<PriorityIndicator priority="high" variant="dot" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
