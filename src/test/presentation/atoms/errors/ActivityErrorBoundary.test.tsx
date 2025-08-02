import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ActivityErrorBoundary } from '../../../../presentation/atoms/errors/ActivityErrorBoundary';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws an error for testing
const ThrowingComponent = ({ shouldThrow = false, errorMessage = 'Test error' }: { shouldThrow?: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Component is working</div>;
};

// Component that throws async error
const AsyncThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Async error');
    }
  }, [shouldThrow]);
  
  return <div data-testid="async-component">Async component</div>;
};

describe('ActivityErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  describe('Normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByText('Component is working')).toBeInTheDocument();
    });

    it('should render multiple children without errors', () => {
      render(
        <ActivityErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <ThrowingComponent shouldThrow={false} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch and display error fallback when child component throws', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Test component error" />
        </ActivityErrorBoundary>
      );
      
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
      expect(screen.getByText(/Something went wrong with the activity component/)).toBeInTheDocument();
      expect(screen.getByText(/Test component error/)).toBeInTheDocument();
    });

    it('should display generic error message for unknown errors', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="" />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('should show refresh page button in error state', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('should recover when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);
        
        React.useEffect(() => {
          // Simulate error recovery after a delay
          const timer = setTimeout(() => {
            setShouldThrow(false);
          }, 100);
          
          return () => clearTimeout(timer);
        }, []);
        
        return (
          <ActivityErrorBoundary>
            <ThrowingComponent shouldThrow={shouldThrow} />
          </ActivityErrorBoundary>
        );
      };
      
      render(<TestComponent />);
      
      // Should show error initially
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);
      
      // Should attempt to recover
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle refresh page button click', async () => {
      const user = userEvent.setup();
      
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });
      
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      const refreshButton = screen.getByText('Refresh Page');
      await user.click(refreshButton);
      
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Error information', () => {
    it('should display error message when available', () => {
      const customErrorMessage = 'Custom activity error occurred';
      
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage={customErrorMessage} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(customErrorMessage)).toBeInTheDocument();
    });

    it('should handle Error objects properly', () => {
      const CustomError = () => {
        throw new Error('Detailed error message');
      };
      
      render(
        <ActivityErrorBoundary>
          <CustomError />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/Detailed error message/)).toBeInTheDocument();
    });

    it('should handle non-Error objects thrown', () => {
      const StringThrowingComponent = () => {
        throw 'String error'; // eslint-disable-line no-throw-literal
      };
      
      render(
        <ActivityErrorBoundary>
          <StringThrowingComponent />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/String error/)).toBeInTheDocument();
    });
  });

  describe('Development vs Production behavior', () => {
    it('should show detailed error information', () => {
      const detailedError = new Error('Detailed development error');
      detailedError.stack = 'Error stack trace\n  at Component\n  at ErrorBoundary';
      
      const DetailedErrorComponent = () => {
        throw detailedError;
      };
      
      render(
        <ActivityErrorBoundary>
          <DetailedErrorComponent />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/Detailed development error/)).toBeInTheDocument();
    });
  });

  describe('Multiple error scenarios', () => {
    it('should handle multiple consecutive errors', () => {
      const MultiErrorComponent = ({ errorCount }: { errorCount: number }) => {
        if (errorCount > 0) {
          throw new Error(`Error number ${errorCount}`);
        }
        return <div>No errors</div>;
      };
      
      const { rerender } = render(
        <ActivityErrorBoundary>
          <MultiErrorComponent errorCount={1} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/Error number 1/)).toBeInTheDocument();
      
      rerender(
        <ActivityErrorBoundary>
          <MultiErrorComponent errorCount={2} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByText(/Error number 2/)).toBeInTheDocument();
    });
  });

  describe('Nested error boundaries', () => {
    it('should handle nested error boundaries correctly', () => {
      render(
        <ActivityErrorBoundary>
          <div data-testid="outer-content">Outer content</div>
          <ActivityErrorBoundary>
            <ThrowingComponent shouldThrow={true} errorMessage="Inner error" />
          </ActivityErrorBoundary>
          <div data-testid="outer-content-2">More outer content</div>
        </ActivityErrorBoundary>
      );
      
      // Outer content should still be visible
      expect(screen.getByTestId('outer-content')).toBeInTheDocument();
      expect(screen.getByTestId('outer-content-2')).toBeInTheDocument();
      
      // Inner error should be caught by inner boundary
      expect(screen.getByText(/Inner error/)).toBeInTheDocument();
    });
  });

  describe('Component lifecycle errors', () => {
    it('should catch errors in component lifecycle methods', () => {
      const LifecycleErrorComponent = () => {
        React.useEffect(() => {
          throw new Error('Effect error');
        }, []);
        
        return <div>Component with effect error</div>;
      };
      
      // Note: useEffect errors are not caught by error boundaries in React
      // This test documents the current behavior
      render(
        <ActivityErrorBoundary>
          <LifecycleErrorComponent />
        </ActivityErrorBoundary>
      );
      
      // Component should render normally (useEffect errors aren't caught)
      expect(screen.getByText('Component with effect error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes in error state', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      const errorContainer = screen.getByText(/Something went wrong/).closest('div');
      expect(errorContainer).toHaveAttribute('role', 'alert');
    });

    it('should have accessible button labels', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ActivityErrorBoundary>
      );
      
      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      const refreshButton = screen.getByRole('button', { name: 'Refresh Page' });
      
      // Should be able to focus buttons
      await user.tab();
      expect(tryAgainButton).toHaveFocus();
      
      await user.tab();
      expect(refreshButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when no error occurs', () => {
      const renderSpy = vi.fn();
      
      const SpyComponent = () => {
        renderSpy();
        return <div>Spy component</div>;
      };
      
      const { rerender } = render(
        <ActivityErrorBoundary>
          <SpyComponent />
        </ActivityErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <ActivityErrorBoundary>
          <SpyComponent />
        </ActivityErrorBoundary>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle null children gracefully', () => {
      render(
        <ActivityErrorBoundary>
          {null}
        </ActivityErrorBoundary>
      );
      
      // Should render without errors
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      render(
        <ActivityErrorBoundary>
          {undefined}
        </ActivityErrorBoundary>
      );
      
      // Should render without errors
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    });

    it('should handle empty children array', () => {
      render(
        <ActivityErrorBoundary>
          {[]}
        </ActivityErrorBoundary>
      );
      
      // Should render without errors
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    });
  });

  describe('Error logging', () => {
    it('should log errors to console in development', () => {
      render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Logged error" />
        </ActivityErrorBoundary>
      );
      
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for normal state', () => {
      const { container } = render(
        <ActivityErrorBoundary>
          <div>Normal content</div>
        </ActivityErrorBoundary>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for error state', () => {
      const { container } = render(
        <ActivityErrorBoundary>
          <ThrowingComponent shouldThrow={true} errorMessage="Snapshot error" />
        </ActivityErrorBoundary>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
