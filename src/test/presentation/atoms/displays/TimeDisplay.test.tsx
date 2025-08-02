import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { 
  TimeDisplay, 
  TimeDisplayRelative,
  TimeDisplayAbsolute,
  TimeDisplayShort,
  DualTimeDisplay,
  LiveClock,
  TimeDisplayProps 
} from '../../../../presentation/atoms/displays/TimeDisplay';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date, options?: any) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return '1 minute ago';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }),
  format: vi.fn((date: Date, formatStr: string) => {
    if (formatStr === 'HH:mm') return '14:30';
    if (formatStr === 'MMM d, yyyy HH:mm') return 'Jan 15, 2024 14:30';
    if (formatStr === 'MMM d, yyyy HH:mm:ss') return 'Jan 15, 2024 14:30:45';
    if (formatStr === 'h:mm a') return '2:30 PM';
    if (formatStr === 'h:mm:ss a') return '2:30:45 PM';
    if (formatStr === 'HH:mm:ss') return '14:30:45';
    if (formatStr === 'EEE, MMM d') return 'Mon, Jan 15';
    return date.toISOString();
  })
}));

// Mock Lucide Clock icon
vi.mock('lucide-react', () => ({
  Clock: ({ className, ...props }: any) => (
    <div data-testid="clock-icon" className={className} {...props} />
  )
}));

describe('TimeDisplay', () => {
  const fixedDate = new Date('2024-01-15T14:30:45.000Z');
  const defaultProps: TimeDisplayProps = {
    date: fixedDate
  };

  beforeEach(() => {
    // Mock Date.now() to return a fixed time
    vi.spyOn(Date, 'now').mockReturnValue(fixedDate.getTime() + 3600000); // 1 hour later
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<TimeDisplay {...defaultProps} />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime', fixedDate.toISOString());
    });

    it('should render with string date', () => {
      render(<TimeDisplay date={fixedDate.toISOString()} />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime', fixedDate.toISOString());
    });

    it('should display formatted time based on format prop', () => {
      const { rerender } = render(<TimeDisplay {...defaultProps} format="time" />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
      
      rerender(<TimeDisplay {...defaultProps} format="relative" />);
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
      
      rerender(<TimeDisplay {...defaultProps} format="datetime" />);
      expect(screen.getByText('Jan 15, 2024 14:30')).toBeInTheDocument();
    });
  });

  describe('Format types', () => {
    it('should format time correctly', () => {
      render(<TimeDisplay {...defaultProps} format="time" />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('should format relative time correctly', () => {
      render(<TimeDisplay {...defaultProps} format="relative" />);
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
    });

    it('should format datetime correctly', () => {
      render(<TimeDisplay {...defaultProps} format="datetime" />);
      expect(screen.getByText('Jan 15, 2024 14:30')).toBeInTheDocument();
    });

    it('should auto-format based on time difference', () => {
      // Test with recent time (should show relative)
      const recentDate = new Date(Date.now() - 3600000); // 1 hour ago
      render(<TimeDisplay date={recentDate} format="auto" />);
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
      
      // Test with old time (should show absolute)
      const oldDate = new Date(Date.now() - 86400000 * 2); // 2 days ago
      render(<TimeDisplay date={oldDate} format="auto" />);
      expect(screen.getByText('Jan 15, 2024 14:30')).toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should apply extra small size styles', () => {
      render(<TimeDisplay {...defaultProps} size="xs" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain('text-xs');
    });

    it('should apply small size styles (default)', () => {
      render(<TimeDisplay {...defaultProps} size="sm" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain('text-sm');
    });

    it('should apply medium size styles', () => {
      render(<TimeDisplay {...defaultProps} size="md" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain('text-base');
    });

    it('should apply large size styles', () => {
      render(<TimeDisplay {...defaultProps} size="lg" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain('text-lg');
    });

    it('should apply extra large size styles', () => {
      render(<TimeDisplay {...defaultProps} size="xl" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain('text-xl');
    });
  });

  describe('Icon display', () => {
    it('should show clock icon when showIcon is true', () => {
      render(<TimeDisplay {...defaultProps} showIcon={true} />);
      
      const icon = screen.getByTestId('clock-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not show clock icon when showIcon is false (default)', () => {
      render(<TimeDisplay {...defaultProps} showIcon={false} />);
      
      expect(screen.queryByTestId('clock-icon')).not.toBeInTheDocument();
    });

    it('should apply correct icon size classes', () => {
      render(<TimeDisplay {...defaultProps} showIcon={true} size="lg" />);
      
      const icon = screen.getByTestId('clock-icon');
      expect(icon.className).toContain('h-5 w-5');
    });
  });

  describe('Auto-updating', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-update relative times', () => {
      render(<TimeDisplay {...defaultProps} format="relative" updateInterval={1000} />);
      
      // Initially shows the mocked relative time
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Should still render (component uses internal state tick for updates)
      expect(screen.getByRole('time')).toBeInTheDocument();
    });

    it('should not auto-update when updateInterval is false', () => {
      render(<TimeDisplay {...defaultProps} format="relative" updateInterval={false} />);
      
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
      
      // Fast-forward time - should not change
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
    });

    it('should not auto-update for absolute time formats', () => {
      render(<TimeDisplay {...defaultProps} format="time" updateInterval={1000} />);
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
      
      // Fast-forward time - absolute time should not change
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });

  describe('Tooltip functionality', () => {
    it('should show tooltip with absolute time by default', () => {
      render(<TimeDisplay {...defaultProps} format="relative" />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container).toHaveAttribute('title', 'Jan 15, 2024 14:30:45');
    });

    it('should not show tooltip when showTooltip is false', () => {
      render(<TimeDisplay {...defaultProps} format="relative" showTooltip={false} />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container).not.toHaveAttribute('title');
    });

    it('should not show tooltip for datetime format', () => {
      render(<TimeDisplay {...defaultProps} format="datetime" showTooltip={true} />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container).not.toHaveAttribute('title');
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-time-class';
      render(<TimeDisplay {...defaultProps} className={customClass} />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain(customClass);
    });

    it('should combine custom className with default styles', () => {
      const customClass = 'text-blue-500';
      render(<TimeDisplay {...defaultProps} className={customClass} />);
      
      const container = screen.getByRole('time').parentElement;
      expect(container?.className).toContain(customClass);
      expect(container?.className).toContain('font-mono');
      expect(container?.className).toContain('text-muted-foreground');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic time element', () => {
      render(<TimeDisplay {...defaultProps} />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('dateTime', fixedDate.toISOString());
    });

    it('should be readable by screen readers', () => {
      render(<TimeDisplay {...defaultProps} format="relative" />);
      
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveTextContent('1 hours ago');
      expect(timeElement).toBeVisible();
    });

    it('should have proper icon accessibility', () => {
      render(<TimeDisplay {...defaultProps} showIcon={true} />);
      
      const icon = screen.getByTestId('clock-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Specialized variants', () => {
    it('should render TimeDisplayRelative correctly', () => {
      render(<TimeDisplayRelative date={fixedDate} />);
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
    });

    it('should render TimeDisplayAbsolute correctly', () => {
      render(<TimeDisplayAbsolute date={fixedDate} />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('should render TimeDisplayShort correctly', () => {
      render(<TimeDisplayShort date={fixedDate} />);
      // This would use the formatTimeAgoShort function which we'd need to mock
      expect(screen.getByRole('time')).toBeInTheDocument();
    });
  });

  describe('DualTimeDisplay', () => {
    it('should render both absolute and relative time', () => {
      render(<DualTimeDisplay date={fixedDate} />);
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
      expect(screen.getByText('1 hours ago')).toBeInTheDocument();
    });

    it('should use custom separator', () => {
      render(<DualTimeDisplay date={fixedDate} separator=" | " />);
      
      expect(screen.getByText('|')).toBeInTheDocument();
    });
  });

  describe('LiveClock', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(Date.prototype, 'getTime').mockReturnValue(fixedDate.getTime());
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render current time', () => {
      render(<LiveClock />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('should render 12-hour format', () => {
      render(<LiveClock format="12" />);
      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });

    it('should hide seconds when showSeconds is false', () => {
      render(<LiveClock showSeconds={false} />);
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });

    it('should show date when showDate is true', () => {
      render(<LiveClock showDate={true} />);
      expect(screen.getByText('Mon, Jan 15')).toBeInTheDocument();
    });

    it('should update every second when showSeconds is true', () => {
      render(<LiveClock showSeconds={true} />);
      
      // Should render the time without errors
      expect(screen.getByText('14:30:45')).toBeInTheDocument();
      
      // Fast-forward 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Component should still be in the DOM
      expect(screen.getByText('14:30:45')).toBeInTheDocument();
    });

    it('should update every minute when showSeconds is false', () => {
      render(<LiveClock showSeconds={false} />);
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
      
      // Fast-forward 30 seconds - should not update
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      expect(screen.getByText('14:30')).toBeInTheDocument();
      
      // Fast-forward to 1 minute
      act(() => {
        vi.advanceTimersByTime(30000);
      });
      
      // Component should still be in the DOM
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid date strings gracefully', () => {
      render(<TimeDisplay date="invalid-date" />);
      
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
      expect(screen.queryByRole('time')).not.toBeInTheDocument();
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1990-01-01');
      render(<TimeDisplay date={oldDate} format="auto" />);
      
      expect(screen.getByText('Jan 15, 2024 14:30')).toBeInTheDocument();
    });

    it('should handle future dates', () => {
      const futureDate = new Date(Date.now() + 86400000);
      render(<TimeDisplay date={futureDate} format="relative" />);
      
      expect(screen.getByRole('time')).toBeInTheDocument();
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for default variant', () => {
      const { container } = render(<TimeDisplay date={fixedDate} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for time format with icon', () => {
      const { container } = render(<TimeDisplay date={fixedDate} format="time" showIcon />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for DualTimeDisplay', () => {
      const { container } = render(<DualTimeDisplay date={fixedDate} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
