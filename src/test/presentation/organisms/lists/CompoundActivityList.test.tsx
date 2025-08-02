import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompoundActivityList } from '../../../../presentation/organisms/lists/CompoundActivityList';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';
import { EnterpriseCardVariant } from '../../../../../components/EnterpriseActivityCard';

// Mock child components
vi.mock('../../../../presentation/organisms/lists/VirtualizedActivityList', () => ({
  VirtualizedActivityList: ({ items, onSelect, onAction, selectedItems }: any) => (
    <div data-testid="virtualized-list">
      {items.map((item: any, index: number) => (
        <div 
          key={item.id} 
          data-testid={`list-item-${index}`}
          onClick={() => onSelect?.(item)}
        >
          {item.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../../presentation/atoms/errors/ActivityErrorBoundary', () => ({
  ActivityErrorBoundary: ({ children }: any) => (
    <div data-testid="error-boundary">{children}</div>
  )
}));

// Mock UI components
vi.mock('../../../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button 
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={`${variant} ${size} ${className}`}
    >
      {children}
    </button>
  )
}));

vi.mock('../../../../../components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, className }: any) => (
    <input 
      data-testid="input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  )
}));

vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <div data-testid="badge" className={variant}>{children}</div>
  )
}));

vi.mock('../../../../../components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('timestamp')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value">Time</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  SortAsc: () => <div data-testid="sort-asc-icon" />,
  SortDesc: () => <div data-testid="sort-desc-icon" />,
  Grid: () => <div data-testid="grid-icon" />,
  List: () => <div data-testid="list-icon" />,
  Layers: () => <div data-testid="layers-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Settings: () => <div data-testid="settings-icon" />
}));

describe('CompoundActivityList', () => {
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
      zone: 'Zone 2',
      assignedTo: 'John Doe'
    },
    {
      id: '3',
      title: 'Medium Priority Activity',
      description: 'Regular maintenance',
      type: 'maintenance',
      priority: 'medium',
      status: 'in-progress',
      timestamp: '2024-01-15T14:40:00Z',
      location: 'Building A',
      zone: 'Zone 3'
    }
  ];

  const mockOnActivitySelect = vi.fn();
  const mockOnActivityAction = vi.fn();
  const mockOnRefresh = vi.fn();

  const defaultProps = {
    activities: mockActivities,
    onActivitySelect: mockOnActivitySelect,
    onActivityAction: mockOnActivityAction,
    onRefresh: mockOnRefresh
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
    });

    it('should show activity count in header', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      expect(screen.getByText('3')).toBeInTheDocument(); // Badge with count
    });

    it('should render loading state', () => {
      render(<CompoundActivityList {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading activities...')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const errorMessage = 'Failed to load activities';
      render(<CompoundActivityList {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText('Error loading activities')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should render search input when enableSearch is true', () => {
      render(<CompoundActivityList {...defaultProps} enableSearch={true} />);
      
      expect(screen.getByTestId('input')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should not render search input when enableSearch is false', () => {
      render(<CompoundActivityList {...defaultProps} enableSearch={false} />);
      
      expect(screen.queryByTestId('input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
    });

    it('should filter activities based on search query', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableSearch={true} />);
      
      const searchInput = screen.getByTestId('input');
      await user.type(searchInput, 'Critical');
      
      // Should show filtered results
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
      expect(screen.queryByText('High Priority Alert')).not.toBeInTheDocument();
    });

    it('should search in title, description, location, and type', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableSearch={true} />);
      
      const searchInput = screen.getByTestId('input');
      
      // Search by description
      await user.clear(searchInput);
      await user.type(searchInput, 'Unauthorized');
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
      
      // Search by location
      await user.clear(searchInput);
      await user.type(searchInput, 'Building B');
      expect(screen.getByText('High Priority Alert')).toBeInTheDocument();
      
      // Search by type
      await user.clear(searchInput);
      await user.type(searchInput, 'maintenance');
      expect(screen.getByText('Medium Priority Activity')).toBeInTheDocument();
    });
  });

  describe('Sorting functionality', () => {
    it('should render sorting controls when enableSorting is true', () => {
      render(<CompoundActivityList {...defaultProps} enableSorting={true} />);
      
      expect(screen.getByTestId('select')).toBeInTheDocument();
      expect(screen.getByTestId('sort-desc-icon')).toBeInTheDocument();
    });

    it('should not render sorting controls when enableSorting is false', () => {
      render(<CompoundActivityList {...defaultProps} enableSorting={false} />);
      
      expect(screen.queryByTestId('select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sort-desc-icon')).not.toBeInTheDocument();
    });

    it('should toggle sort direction when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableSorting={true} />);
      
      const sortButton = screen.getByTestId('sort-desc-icon').parentElement;
      expect(screen.getByTestId('sort-desc-icon')).toBeInTheDocument();
      
      await user.click(sortButton!);
      expect(screen.getByTestId('sort-asc-icon')).toBeInTheDocument();
    });
  });

  describe('Filtering functionality', () => {
    it('should show filter button when enableFiltering is true', () => {
      render(<CompoundActivityList {...defaultProps} enableFiltering={true} />);
      
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('should not show filter button when enableFiltering is false', () => {
      render(<CompoundActivityList {...defaultProps} enableFiltering={false} />);
      
      expect(screen.queryByTestId('filter-icon')).not.toBeInTheDocument();
    });

    it('should toggle filter panel when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableFiltering={true} />);
      
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      
      // Filter panel should not be visible initially
      expect(screen.queryByText('Priority')).not.toBeInTheDocument();
      
      await user.click(filterButton!);
      
      // Filter panel should be visible after clicking
      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('should show priority filter options', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableFiltering={true} />);
      
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton!);
      
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  describe('View mode toggle', () => {
    it('should toggle between list and grid view', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} />);
      
      const viewToggleButton = screen.getByTestId('grid-icon').parentElement;
      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
      
      await user.click(viewToggleButton!);
      expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    });
  });

  describe('Refresh functionality', () => {
    it('should show refresh button when onRefresh is provided', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should not show refresh button when onRefresh is not provided', () => {
      render(<CompoundActivityList {...defaultProps} onRefresh={undefined} />);
      
      expect(screen.queryByTestId('refresh-icon')).not.toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} />);
      
      const refreshButton = screen.getByTestId('refresh-icon').parentElement;
      await user.click(refreshButton!);
      
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should call onRefresh when retry button is clicked in error state', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} error="Test error" />);
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe('Clustering functionality', () => {
    it('should show clustering badge when enableClustering is true', () => {
      render(<CompoundActivityList {...defaultProps} enableClustering={true} />);
      
      expect(screen.getByTestId('layers-icon')).toBeInTheDocument();
      expect(screen.getByText('Clustered')).toBeInTheDocument();
    });

    it('should not show clustering badge when enableClustering is false', () => {
      render(<CompoundActivityList {...defaultProps} enableClustering={false} />);
      
      expect(screen.queryByTestId('layers-icon')).not.toBeInTheDocument();
      expect(screen.queryByText('Clustered')).not.toBeInTheDocument();
    });

    it('should create clusters from activities with same location and timeframe', () => {
      // Add more activities in same location and time
      const activitiesWithClusters = [
        ...mockActivities,
        {
          id: '4',
          title: 'Another Activity in Building A',
          description: 'Another event',
          type: 'alert',
          priority: 'high',
          status: 'detecting',
          timestamp: '2024-01-15T14:31:00Z', // Within 30 minutes
          location: 'Building A',
          zone: 'Zone 1'
        }
      ];
      
      render(
        <CompoundActivityList 
          {...defaultProps} 
          activities={activitiesWithClusters}
          enableClustering={true} 
        />
      );
      
      // Should show clustered activities
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Virtualization control', () => {
    it('should use virtualized list when enableVirtualization is true', () => {
      render(<CompoundActivityList {...defaultProps} enableVirtualization={true} />);
      
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('should use standard list when enableVirtualization is false', () => {
      render(<CompoundActivityList {...defaultProps} enableVirtualization={false} />);
      
      // Should still render but without virtualization
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('should call onActivitySelect when activity is selected', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} />);
      
      const firstActivity = screen.getByText('Critical Security Alert');
      await user.click(firstActivity);
      
      expect(mockOnActivitySelect).toHaveBeenCalledWith(mockActivities[0]);
    });

    it('should handle activity selection and deselection', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} />);
      
      const firstActivity = screen.getByText('Critical Security Alert');
      
      // First click should select
      await user.click(firstActivity);
      expect(mockOnActivitySelect).toHaveBeenCalledWith(mockActivities[0]);
      
      // Second click should deselect (component handles this internally)
      await user.click(firstActivity);
      expect(mockOnActivitySelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading states', () => {
    it('should show spinner when loading', () => {
      render(<CompoundActivityList {...defaultProps} loading={true} />);
      
      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon.parentElement).toHaveClass('animate-spin');
    });

    it('should disable refresh button when loading', () => {
      render(<CompoundActivityList {...defaultProps} loading={true} />);
      
      const refreshButton = screen.getByTestId('refresh-icon').parentElement;
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Activities');
    });

    it('should have accessible search input', () => {
      render(<CompoundActivityList {...defaultProps} enableSearch={true} />);
      
      const searchInput = screen.getByTestId('input');
      expect(searchInput).toHaveAttribute('placeholder', 'Search activities...');
    });

    it('should have keyboard accessible controls', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CompoundActivityList {...defaultProps} className="custom-list" />
      );
      
      expect(container.firstChild).toHaveClass('custom-list');
    });

    it('should apply custom height', () => {
      render(<CompoundActivityList {...defaultProps} height={800} />);
      
      // Height is passed to the virtualized list
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Priority-based sorting', () => {
    it('should sort activities by priority correctly', () => {
      render(<CompoundActivityList {...defaultProps} />);
      
      // Activities should be sorted by timestamp desc by default
      const activities = screen.getAllByTestId(/list-item-/);
      expect(activities[0]).toHaveTextContent('Medium Priority Activity'); // Latest timestamp
      expect(activities[1]).toHaveTextContent('High Priority Alert');
      expect(activities[2]).toHaveTextContent('Critical Security Alert'); // Earliest timestamp
    });
  });

  describe('Filter combinations', () => {
    it('should handle multiple filter types', async () => {
      const user = userEvent.setup();
      render(<CompoundActivityList {...defaultProps} enableFiltering={true} />);
      
      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton!);
      
      // Select priority filter
      const criticalCheckbox = screen.getByRole('checkbox', { name: /critical/ });
      await user.click(criticalCheckbox);
      
      // Should filter to show only critical activities
      expect(screen.getByText('Critical Security Alert')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty activities array', () => {
      render(<CompoundActivityList {...defaultProps} activities={[]} />);
      
      expect(screen.getByText('0')).toBeInTheDocument(); // Count badge
    });

    it('should handle activities without required fields gracefully', () => {
      const incompleteActivities = [
        {
          id: '1',
          title: 'Incomplete Activity',
          type: 'alert',
          priority: 'medium',
          status: 'detecting',
          timestamp: '2024-01-15T14:30:00Z',
          location: 'Building A'
        } as EnterpriseActivity
      ];
      
      render(<CompoundActivityList {...defaultProps} activities={incompleteActivities} />);
      
      expect(screen.getByText('Incomplete Activity')).toBeInTheDocument();
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for default state', () => {
      const { container } = render(<CompoundActivityList {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for loading state', () => {
      const { container } = render(<CompoundActivityList {...defaultProps} loading={true} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for error state', () => {
      const { container } = render(
        <CompoundActivityList {...defaultProps} error="Test error" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
