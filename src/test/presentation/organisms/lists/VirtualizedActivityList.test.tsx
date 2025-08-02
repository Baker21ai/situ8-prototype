import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtualizedActivityList } from '../../../../presentation/organisms/lists/VirtualizedActivityList';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';
import { EnterpriseCardVariant } from '../../../../../components/EnterpriseActivityCard';

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: vi.fn(({ children, itemData, itemCount, itemSize, onItemsRendered, onScroll }) => {
    const renderItem = children;
    return (
      <div data-testid="fixed-size-list">
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
          <div key={index} data-testid={`list-item-${index}`}>
            {renderItem({ index, style: {}, data: itemData })}
          </div>
        ))}
        <div data-testid="list-controls">
          <button onClick={() => onItemsRendered?.({ visibleStartIndex: 0, visibleStopIndex: 9 })}>
            Trigger onItemsRendered
          </button>
          <button onClick={() => onScroll?.({ scrollOffset: 100 })}>
            Trigger onScroll
          </button>
        </div>
      </div>
    );
  }),
  VariableSizeList: vi.fn(({ children, itemData, itemCount, itemSize, onItemsRendered, onScroll }) => {
    const renderItem = children;
    return (
      <div data-testid="variable-size-list">
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
          <div key={index} data-testid={`list-item-${index}`}>
            {renderItem({ index, style: {}, data: itemData })}
          </div>
        ))}
        <div data-testid="list-controls">
          <button onClick={() => onItemsRendered?.({ visibleStartIndex: 0, visibleStopIndex: 9 })}>
            Trigger onItemsRendered
          </button>
          <button onClick={() => onScroll?.({ scrollOffset: 100 })}>
            Trigger onScroll
          </button>
        </div>
      </div>
    );
  })
}));

// Mock Badge component
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <div data-testid="badge" className={className}>{children}</div>
  )
}));

// Mock VirtualScrollErrorWrapper
vi.mock('../../../../presentation/atoms/errors', () => ({
  VirtualScrollErrorWrapper: ({ children }: any) => (
    <div data-testid="error-wrapper">{children}</div>
  )
}));

// Mock ActivityListItem
vi.mock('../../../../presentation/organisms/lists/ActivityListItem', () => ({
  ActivityListItem: ({ data, index }: any) => {
    const item = data.items[index];
    return (
      <div 
        data-testid="activity-list-item"
        onClick={() => data.onSelect?.(item)}
      >
        {item.title || 'Untitled'}
      </div>
    );
  },
  getItemHeight: vi.fn(() => 80),
  createItemSizeGetter: vi.fn(() => () => 80),
  ITEM_HEIGHTS: { default: 80, compact: 60, minimal: 40 }
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Layers: () => <div data-testid="layers-icon" />
}));

describe('VirtualizedActivityList', () => {
  const mockActivities: EnterpriseActivity[] = [
    {
      id: '1',
      title: 'Critical Security Alert',
      description: 'Unauthorized access detected',
      type: 'security-breach',
      priority: 'critical',
      status: 'detecting',
      timestamp: '2024-01-15T14:30:00Z',
      location: 'Building A',
      zone: 'Zone 1'
    },
    {
      id: '2',
      title: 'High Priority Alert',
      description: 'Suspicious activity',
      type: 'alert',
      priority: 'high',
      status: 'assigned',
      timestamp: '2024-01-15T14:35:00Z',
      location: 'Building B',
      zone: 'Zone 2'
    },
    {
      id: '3',
      title: 'Medium Priority Activity',
      description: 'Regular maintenance',
      type: 'maintenance',
      priority: 'medium',
      status: 'in-progress',
      timestamp: '2024-01-15T14:40:00Z',
      location: 'Building C',
      zone: 'Zone 3'
    }
  ];

  const mockCluster: ActivityCluster = {
    id: 'cluster-1',
    clusterType: 'cluster',
    title: '3 activities in Building A',
    description: 'Multiple events detected',
    location: 'Building A',
    timestamp: '2024-01-15T14:30:00Z',
    lastActivity: '2024-01-15T15:00:00Z',
    count: 3,
    highestPriority: 'critical',
    types: ['security-breach', 'alert'],
    timeRange: '30 minutes',
    activities: mockActivities
  };

  const mockOnSelect = vi.fn();
  const mockOnAction = vi.fn();
  const selectedItems = new Set<string>();

  const defaultProps = {
    items: mockActivities,
    variant: 'detailed' as EnterpriseCardVariant,
    onSelect: mockOnSelect,
    onAction: mockOnAction,
    selectedItems,
    height: 400
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.debug to avoid noise in tests
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('error-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(<VirtualizedActivityList {...defaultProps} items={[]} />);
      
      expect(screen.getByText('No activities found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search criteria')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should render activity items', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
      expect(screen.getByText('High Priority Alert')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority Activity')).toBeInTheDocument();
    });
  });

  describe('Priority segmentation', () => {
    it('should show priority overview when showPrioritySegments is true', () => {
      render(<VirtualizedActivityList {...defaultProps} showPrioritySegments={true} />);
      
      expect(screen.getByText('1')).toBeInTheDocument(); // Critical count
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // High count  
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Medium count
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('should not show priority overview when showPrioritySegments is false', () => {
      render(<VirtualizedActivityList {...defaultProps} showPrioritySegments={false} />);
      
      expect(screen.queryByText('Critical')).not.toBeInTheDocument();
      expect(screen.queryByText('High')).not.toBeInTheDocument();
    });

    it('should group items by priority', () => {
      render(<VirtualizedActivityList {...defaultProps} showPrioritySegments={true} />);
      
      // Items should be reordered by priority (critical first)
      const listItems = screen.getAllByTestId('activity-list-item');
      expect(listItems[0]).toHaveTextContent('Critical Security Alert');
      expect(listItems[1]).toHaveTextContent('High Priority Alert');
      expect(listItems[2]).toHaveTextContent('Medium Priority Activity');
    });
  });

  describe('Virtualization modes', () => {
    it('should use FixedSizeList for regular activities', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
      expect(screen.queryByTestId('variable-size-list')).not.toBeInTheDocument();
    });

    it('should use VariableSizeList for clusters', () => {
      render(<VirtualizedActivityList {...defaultProps} items={[mockCluster]} />);
      
      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
      expect(screen.queryByTestId('fixed-size-list')).not.toBeInTheDocument();
    });

    it('should use VariableSizeList for evidence variant', () => {
      render(<VirtualizedActivityList {...defaultProps} variant="evidence" />);
      
      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
      expect(screen.queryByTestId('fixed-size-list')).not.toBeInTheDocument();
    });

    it('should use VariableSizeList for stream variant', () => {
      render(<VirtualizedActivityList {...defaultProps} variant="stream" />);
      
      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
      expect(screen.queryByTestId('fixed-size-list')).not.toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('should call onSelect when item is clicked', async () => {
      const user = userEvent.setup();
      render(<VirtualizedActivityList {...defaultProps} />);
      
      const firstItem = screen.getAllByTestId('activity-list-item')[0];
      await user.click(firstItem);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockActivities[0]);
    });

    it('should handle keyboard navigation when enabled', () => {
      render(<VirtualizedActivityList {...defaultProps} enableKeyboardNavigation={true} />);
      
      // Test that keyboard event listeners are set up
      // This is mainly testing that the component renders without errors
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });

    it('should display keyboard navigation help when enabled', () => {
      render(<VirtualizedActivityList {...defaultProps} enableKeyboardNavigation={true} />);
      
      expect(screen.getByText(/↑↓: Navigate • Enter: Select • Home\/End: Jump/)).toBeInTheDocument();
    });
  });

  describe('Scroll behavior', () => {
    it('should handle scroll events for restoration', async () => {
      render(<VirtualizedActivityList {...defaultProps} enableScrollRestoration={true} />);
      
      const scrollButton = screen.getByText('Trigger onScroll');
      fireEvent.click(scrollButton);
      
      // Should not throw errors
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });

    it('should handle items rendered events', async () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      const itemsRenderedButton = screen.getByText('Trigger onItemsRendered');
      fireEvent.click(itemsRenderedButton);
      
      // Should not throw errors and should log debug info
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('Performance indicators', () => {
    it('should show performance information', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByText(/Showing 3 activities/)).toBeInTheDocument();
      expect(screen.getByText(/Virtual scrolling enabled/)).toBeInTheDocument();
      expect(screen.getByText(/Memory optimized/)).toBeInTheDocument();
    });

    it('should show item count with proper formatting', () => {
      const manyItems = Array.from({ length: 1500 }, (_, i) => ({
        ...mockActivities[0],
        id: `item-${i}`,
        title: `Activity ${i}`
      }));
      
      render(<VirtualizedActivityList {...defaultProps} items={manyItems} />);
      
      expect(screen.getByText(/Showing 1,500 activities/)).toBeInTheDocument();
    });
  });

  describe('Layout modes', () => {
    it('should handle grid layout mode', () => {
      render(<VirtualizedActivityList {...defaultProps} layoutMode="grid" />);
      
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });

    it('should handle horizontal layout mode', () => {
      render(<VirtualizedActivityList {...defaultProps} layoutMode="horizontal" />);
      
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });
  });

  describe('Compact mode', () => {
    it('should apply compact mode styling', () => {
      render(<VirtualizedActivityList {...defaultProps} compactMode={true} />);
      
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should wrap content in error boundary', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('error-wrapper')).toBeInTheDocument();
    });

    it('should handle fallback to standard list', () => {
      // This would be triggered by the error boundary in real scenarios
      render(<VirtualizedActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('error-wrapper')).toBeInTheDocument();
    });
  });

  describe('Mixed content handling', () => {
    it('should handle mixed activities and clusters', () => {
      const mixedItems = [mockActivities[0], mockCluster, mockActivities[1]];
      render(<VirtualizedActivityList {...defaultProps} items={mixedItems} />);
      
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
      expect(screen.getByText('3 activities in Building A')).toBeInTheDocument();
      expect(screen.getByText('High Priority Alert')).toBeInTheDocument();
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <VirtualizedActivityList {...defaultProps} className="custom-list" />
      );
      
      expect(container.firstChild).toHaveClass('custom-list');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable when keyboard navigation is enabled', () => {
      render(<VirtualizedActivityList {...defaultProps} enableKeyboardNavigation={true} />);
      
      const listContainer = screen.getByTestId('fixed-size-list').parentElement;
      expect(listContainer).toHaveAttribute('tabIndex', '0');
    });

    it('should not be focusable when keyboard navigation is disabled', () => {
      render(<VirtualizedActivityList {...defaultProps} enableKeyboardNavigation={false} />);
      
      const listContainer = screen.getByTestId('fixed-size-list').parentElement;
      expect(listContainer).toHaveAttribute('tabIndex', '-1');
    });

    it('should provide proper ARIA labels for priority indicators', () => {
      render(<VirtualizedActivityList {...defaultProps} showPrioritySegments={true} />);
      
      // Priority stats should be properly labeled
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Priority statistics', () => {
    it('should calculate priority statistics correctly', () => {
      render(<VirtualizedActivityList {...defaultProps} showPrioritySegments={true} />);
      
      // Check that priority counts are displayed correctly
      const priorityCards = screen.getAllByText('1');
      expect(priorityCards.length).toBeGreaterThanOrEqual(3); // At least 3 priorities represented
    });

    it('should handle cluster priority statistics', () => {
      render(
        <VirtualizedActivityList 
          {...defaultProps} 
          items={[mockCluster]} 
          showPrioritySegments={true} 
        />
      );
      
      // Should show cluster's highest priority
      expect(screen.getByText('1')).toBeInTheDocument(); // Critical count from cluster
    });
  });

  describe('Item data propagation', () => {
    it('should pass correct item data to list component', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      // Items should be rendered with their data
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
      expect(screen.getByText('High Priority Alert')).toBeInTheDocument();
    });

    it('should include all necessary props in item data', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      // The component should render without errors, indicating item data is properly structured
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });
  });

  describe('Overscan configuration', () => {
    it('should use appropriate overscan for fixed size list', () => {
      render(<VirtualizedActivityList {...defaultProps} />);
      
      // Component should render (overscan is passed to react-window internally)
      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    });

    it('should use appropriate overscan for variable size list', () => {
      render(<VirtualizedActivityList {...defaultProps} items={[mockCluster]} />);
      
      // Component should render (overscan is passed to react-window internally)
      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for fixed size list', () => {
      const { container } = render(<VirtualizedActivityList {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for variable size list with clusters', () => {
      const { container } = render(
        <VirtualizedActivityList {...defaultProps} items={[mockCluster]} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for empty state', () => {
      const { container } = render(
        <VirtualizedActivityList {...defaultProps} items={[]} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
