import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  QuickActions, 
  QuickActionsCompact,
  QuickActionsMinimal,
  QuickActionsFloating,
  CriticalQuickActions,
  ReviewQuickActions,
  QuickActionsProps 
} from '../../../../presentation/molecules/controls/QuickActions';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';

// Mock ActionButton
vi.mock('../../../../presentation/atoms/buttons/ActionButton', () => ({
  ActionButton: ({ children, onClick, disabled, variant, icon, size }: any) => (
    <button 
      data-testid="action-button"
      onClick={onClick}
      disabled={disabled}
      className={`action-button ${variant} ${size}`}
      data-variant={variant}
    >
      {icon}
      {children}
    </button>
  )
}));

// Mock UI components
vi.mock('../../../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, variant, className, title, ...props }: any) => (
    <button 
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={`${size} ${variant} ${className}`}
      title={title}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  User: () => <div data-testid="user-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}));

describe('QuickActions', () => {
  const mockActivity: EnterpriseActivity = {
    id: '1',
    title: 'Security Alert',
    description: 'Unauthorized access detected',
    type: 'security-breach',
    priority: 'high',
    status: 'detecting',
    timestamp: '2024-01-15T14:30:00Z',
    location: 'Building A',
    zone: 'Zone 1'
  };

  const mockCluster: ActivityCluster = {
    id: 'cluster-1',
    clusterType: 'cluster',
    title: '5 activities in Building A',
    description: 'Multiple security events detected',
    location: 'Building A',
    timestamp: '2024-01-15T14:30:00Z',
    lastActivity: '2024-01-15T15:00:00Z',
    count: 5,
    highestPriority: 'critical',
    types: ['security-breach', 'alert'],
    timeRange: '30 minutes',
    activities: [mockActivity]
  };

  const mockOnAction = vi.fn();

  const defaultProps: QuickActionsProps = {
    activity: mockActivity,
    onAction: mockOnAction
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<QuickActions {...defaultProps} />);
      
      // Should show escalate (high priority can be escalated)
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      // Should show assign (no assignedTo)
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      // Should show view
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should render different variants', () => {
      const { rerender } = render(<QuickActions {...defaultProps} variant="full" />);
      expect(screen.getByText('Escalate')).toBeInTheDocument();
      
      rerender(<QuickActions {...defaultProps} variant="compact" />);
      expect(screen.queryByText('Escalate')).not.toBeInTheDocument();
      
      rerender(<QuickActions {...defaultProps} variant="minimal" />);
      expect(screen.queryByText('Escalate')).not.toBeInTheDocument();
    });
  });

  describe('Action filtering by conditions', () => {
    it('should show escalate action for non-critical activities', () => {
      render(<QuickActions activity={mockActivity} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should not show escalate action for critical activities', () => {
      const criticalActivity = { ...mockActivity, priority: 'critical' as const };
      render(<QuickActions activity={criticalActivity} />);
      
      const escalateButtons = screen.queryAllByTestId('action-button').filter(btn => 
        btn.querySelector('[data-testid="alert-triangle-icon"]')
      );
      expect(escalateButtons).toHaveLength(0);
    });

    it('should show assign action for unassigned activities', () => {
      render(<QuickActions activity={mockActivity} />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should not show assign action for assigned activities', () => {
      const assignedActivity = { ...mockActivity, assignedTo: 'John Doe' };
      render(<QuickActions activity={assignedActivity} />);
      
      const assignButtons = screen.queryAllByTestId('action-button').filter(btn => 
        btn.querySelector('[data-testid="user-icon"]')
      );
      expect(assignButtons).toHaveLength(0);
    });

    it('should show mark resolved for non-resolved activities', () => {
      render(<QuickActions activity={mockActivity} />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should not show mark resolved for resolved activities', () => {
      const resolvedActivity = { ...mockActivity, status: 'resolved' as const };
      render(<QuickActions activity={resolvedActivity} />);
      
      const resolveButtons = screen.queryAllByTestId('action-button').filter(btn => 
        btn.querySelector('[data-testid="check-circle-icon"]')
      );
      expect(resolveButtons).toHaveLength(0);
    });

    it('should not show create incident and add to case for clusters', () => {
      render(<QuickActions activity={mockCluster} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('file-text-icon')).not.toBeInTheDocument();
    });
  });

  describe('Available actions filtering', () => {
    it('should only show specified available actions', () => {
      render(
        <QuickActions 
          {...defaultProps} 
          availableActions={['view', 'escalate']}
        />
      );
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
    });

    it('should show all actions when availableActions is not specified', () => {
      render(<QuickActions {...defaultProps} />);
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });
  });

  describe('Variant behaviors', () => {
    it('should limit actions in minimal variant', () => {
      render(<QuickActions {...defaultProps} variant="minimal" />);
      
      const actionButtons = screen.getAllByTestId('button');
      expect(actionButtons.length).toBeLessThanOrEqual(2);
    });

    it('should limit actions in compact variant', () => {
      render(<QuickActions {...defaultProps} variant="compact" />);
      
      const actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons.length).toBeLessThanOrEqual(4);
    });

    it('should limit actions in floating variant', () => {
      render(<QuickActions {...defaultProps} variant="floating" />);
      
      const actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons.length).toBeLessThanOrEqual(3);
    });

    it('should render floating variant with fixed positioning', () => {
      const { container } = render(<QuickActions {...defaultProps} variant="floating" />);
      
      const floatingContainer = container.firstChild as HTMLElement;
      expect(floatingContainer.className).toContain('fixed');
      expect(floatingContainer.className).toContain('bottom-4');
      expect(floatingContainer.className).toContain('right-4');
    });

    it('should show icons only in minimal variant', () => {
      render(<QuickActions {...defaultProps} variant="minimal" />);
      
      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button.textContent).toBe(''); // No text, only icons
      });
    });
  });

  describe('Action handling', () => {
    it('should call onAction when escalate is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const escalateButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="alert-triangle-icon"]')
      );
      
      await user.click(escalateButton!);
      expect(mockOnAction).toHaveBeenCalledWith('escalate', mockActivity);
    });

    it('should call onAction when view is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const viewButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      await user.click(viewButton!);
      expect(mockOnAction).toHaveBeenCalledWith('view', mockActivity);
    });

    it('should call onAction when assign is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const assignButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="user-icon"]')
      );
      
      await user.click(assignButton!);
      expect(mockOnAction).toHaveBeenCalledWith('assign', mockActivity);
    });

    it('should call onAction when more options is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const moreButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="more-horizontal-icon"]')
      );
      
      await user.click(moreButton!);
      expect(mockOnAction).toHaveBeenCalledWith('more_options', mockActivity);
    });
  });

  describe('Cluster-specific actions', () => {
    it('should show cluster-specific actions', () => {
      render(<QuickActions activity={mockCluster} />);
      
      expect(screen.getByText('View All 5')).toBeInTheDocument();
      expect(screen.getByText('Split Cluster')).toBeInTheDocument();
    });

    it('should call onAction for view all cluster action', async () => {
      const user = userEvent.setup();
      render(<QuickActions activity={mockCluster} onAction={mockOnAction} />);
      
      const viewAllButton = screen.getByText('View All 5');
      await user.click(viewAllButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('view_all', mockCluster);
    });

    it('should call onAction for split cluster action', async () => {
      const user = userEvent.setup();
      render(<QuickActions activity={mockCluster} onAction={mockOnAction} />);
      
      const splitButton = screen.getByText('Split Cluster');
      await user.click(splitButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('split_cluster', mockCluster);
    });
  });

  describe('Disabled state', () => {
    it('should disable all actions when disabled prop is true', () => {
      render(<QuickActions {...defaultProps} disabled={true} />);
      
      const buttons = screen.getAllByTestId('button');
      const actionButtons = screen.getAllByTestId('action-button');
      
      [...buttons, ...actionButtons].forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not call onAction when disabled', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} disabled={true} />);
      
      const viewButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      await user.click(viewButton!);
      expect(mockOnAction).not.toHaveBeenCalled();
    });
  });

  describe('Button sizing', () => {
    it('should use correct button sizes for variants', () => {
      const { rerender } = render(<QuickActions {...defaultProps} variant="full" />);
      
      let actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('default');
      
      rerender(<QuickActions {...defaultProps} variant="compact" />);
      actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('sm');
      
      rerender(<QuickActions {...defaultProps} variant="minimal" />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons[0].className).toContain('sm');
    });
  });

  describe('Action variants', () => {
    it('should apply correct action variants', () => {
      render(<QuickActions {...defaultProps} />);
      
      const escalateButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="alert-triangle-icon"]')
      );
      expect(escalateButton).toHaveAttribute('data-variant', 'critical');
      
      const assignButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="user-icon"]')
      );
      expect(assignButton).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('Tooltips in minimal variant', () => {
    it('should show tooltips for icons in minimal variant', () => {
      render(<QuickActions {...defaultProps} variant="minimal" />);
      
      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('title');
      });
    });
  });

  describe('Specialized variants', () => {
    it('should render QuickActionsCompact correctly', () => {
      render(<QuickActionsCompact activity={mockActivity} />);
      
      const actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('sm');
    });

    it('should render QuickActionsMinimal correctly', () => {
      render(<QuickActionsMinimal activity={mockActivity} />);
      
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeLessThanOrEqual(2);
    });

    it('should render QuickActionsFloating correctly', () => {
      const { container } = render(<QuickActionsFloating activity={mockActivity} />);
      
      const floatingContainer = container.firstChild as HTMLElement;
      expect(floatingContainer.className).toContain('fixed');
      expect(floatingContainer.className).toContain('z-50');
    });

    it('should render CriticalQuickActions with specific actions', () => {
      render(<CriticalQuickActions activity={mockActivity} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument(); // escalate
      expect(screen.getByTestId('user-icon')).toBeInTheDocument(); // assign
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument(); // no mark resolved
    });

    it('should render ReviewQuickActions with specific actions', () => {
      render(<ReviewQuickActions activity={mockActivity} />);
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument(); // view
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // mark resolved
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument(); // dismiss
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument(); // no escalate
    });
  });

  describe('Full action workflow', () => {
    it('should show create incident action', () => {
      render(<QuickActions {...defaultProps} />);
      
      expect(screen.getByText('Create Incident')).toBeInTheDocument();
    });

    it('should show add to case action', () => {
      render(<QuickActions {...defaultProps} />);
      
      expect(screen.getByText('Add to Case')).toBeInTheDocument();
    });

    it('should show mark resolved action', () => {
      render(<QuickActions {...defaultProps} />);
      
      expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
    });

    it('should show dismiss action', () => {
      render(<QuickActions {...defaultProps} />);
      
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<QuickActions {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const firstButton = screen.getAllByRole('button')[0];
      await user.tab();
      
      expect(firstButton).toHaveFocus();
    });

    it('should handle keyboard activation', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />);
      
      const viewButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      viewButton?.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnAction).toHaveBeenCalledWith('view', mockActivity);
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-quick-actions';
      const { container } = render(<QuickActions {...defaultProps} className={customClass} />);
      
      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('Edge cases', () => {
    it('should handle activity without onAction callback', () => {
      render(<QuickActions activity={mockActivity} />);
      
      // Should render without errors
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should handle empty availableActions array', () => {
      render(<QuickActions {...defaultProps} availableActions={[]} />);
      
      // Should show only more options button
      const actionButtons = screen.queryAllByTestId('action-button');
      expect(actionButtons).toHaveLength(0);
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for full variant', () => {
      const { container } = render(<QuickActions activity={mockActivity} variant="full" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for minimal variant', () => {
      const { container } = render(<QuickActions activity={mockActivity} variant="minimal" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for floating variant', () => {
      const { container } = render(<QuickActions activity={mockActivity} variant="floating" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
