import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  ActivityActions, 
  ActivityActionsCompact,
  ActivityActionsMinimal,
  ActivityActionsTooltip,
  ActivityActionsProps 
} from '../../../../presentation/molecules/controls/ActivityActions';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';

// Mock UI components
vi.mock('../../../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, variant, className, ...props }: any) => (
    <button 
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={`${size} ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock ActionButton
vi.mock('../../../../presentation/atoms/buttons/ActionButton', () => ({
  ActionButton: ({ children, onClick, disabled, variant, icon, size }: any) => (
    <button 
      data-testid="action-button"
      onClick={onClick}
      disabled={disabled}
      className={`action-button ${variant} ${size}`}
    >
      {icon}
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  MoreVertical: () => <div data-testid="more-vertical-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />
}));

describe('ActivityActions', () => {
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

  const defaultProps: ActivityActionsProps = {
    activity: mockActivity,
    onAction: mockOnAction
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ActivityActions {...defaultProps} />);
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      expect(screen.getByTestId('more-vertical-icon')).toBeInTheDocument();
    });

    it('should render different variants', () => {
      const { rerender } = render(<ActivityActions {...defaultProps} variant="full" />);
      expect(screen.getByText('Escalate')).toBeInTheDocument();
      
      rerender(<ActivityActions {...defaultProps} variant="compact" />);
      expect(screen.queryByText('Escalate')).not.toBeInTheDocument();
      
      rerender(<ActivityActions {...defaultProps} variant="minimal" />);
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });
  });

  describe('Variant behaviors', () => {
    it('should render minimal variant with only expand/collapse', () => {
      render(
        <ActivityActions 
          {...defaultProps} 
          variant="minimal" 
          showExpandCollapse={true}
          isExpanded={false}
        />
      );
      
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should render tooltip variant with only more options', () => {
      render(<ActivityActions {...defaultProps} variant="tooltip" />);
      
      expect(screen.getByTestId('more-vertical-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should show collapse icon when expanded', () => {
      render(
        <ActivityActions 
          {...defaultProps} 
          variant="minimal" 
          showExpandCollapse={true}
          isExpanded={true}
        />
      );
      
      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
    });
  });

  describe('Action handling', () => {
    it('should call onAction when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const viewButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      await user.click(viewButton!);
      expect(mockOnAction).toHaveBeenCalledWith('view', mockActivity);
    });

    it('should call onAction when escalate button is clicked', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const escalateButton = screen.getAllByTestId('action-button').find(btn => 
        btn.querySelector('[data-testid="alert-triangle-icon"]')
      );
      
      await user.click(escalateButton!);
      expect(mockOnAction).toHaveBeenCalledWith('escalate', mockActivity);
    });

    it('should call onAction when more options is clicked', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const moreButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="more-vertical-icon"]')
      );
      
      await user.click(moreButton!);
      expect(mockOnAction).toHaveBeenCalledWith('more_options', mockActivity);
    });

    it('should prevent event propagation on action clicks', async () => {
      const user = userEvent.setup();
      const mockParentClick = vi.fn();
      
      render(
        <div onClick={mockParentClick}>
          <ActivityActions {...defaultProps} />
        </div>
      );
      
      const viewButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      await user.click(viewButton!);
      expect(mockOnAction).toHaveBeenCalled();
      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Conditional actions', () => {
    it('should show escalate action for non-critical activities', () => {
      render(<ActivityActions activity={mockActivity} />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should not show escalate action for critical activities', () => {
      const criticalActivity = { ...mockActivity, priority: 'critical' as const };
      render(<ActivityActions activity={criticalActivity} />);
      
      const escalateButtons = screen.queryAllByTestId('action-button').filter(btn => 
        btn.querySelector('[data-testid="alert-triangle-icon"]')
      );
      expect(escalateButtons).toHaveLength(0);
    });

    it('should show assign action for unassigned activities', () => {
      render(<ActivityActions activity={mockActivity} />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should not show assign action for assigned activities', () => {
      const assignedActivity = { ...mockActivity, assignedTo: 'John Doe' };
      render(<ActivityActions activity={assignedActivity} />);
      
      const assignButtons = screen.queryAllByTestId('action-button').filter(btn => 
        btn.querySelector('[data-testid="user-icon"]')
      );
      expect(assignButtons).toHaveLength(0);
    });
  });

  describe('Cluster actions', () => {
    it('should show cluster-specific actions', () => {
      render(<ActivityActions activity={mockCluster} />);
      
      expect(screen.getByText('View All 5')).toBeInTheDocument();
    });

    it('should not show individual activity actions for clusters', () => {
      render(<ActivityActions activity={mockCluster} />);
      
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-icon')).not.toBeInTheDocument();
    });

    it('should call onAction for cluster view all', async () => {
      const user = userEvent.setup();
      render(<ActivityActions activity={mockCluster} onAction={mockOnAction} />);
      
      const viewAllButton = screen.getByText('View All 5');
      await user.click(viewAllButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('view_all', mockCluster);
    });
  });

  describe('Disabled state', () => {
    it('should disable all actions when disabled prop is true', () => {
      render(<ActivityActions {...defaultProps} disabled={true} />);
      
      const buttons = screen.getAllByTestId('button');
      const actionButtons = screen.getAllByTestId('action-button');
      
      [...buttons, ...actionButtons].forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not call onAction when disabled', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} disabled={true} />);
      
      const viewButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      await user.click(viewButton!);
      expect(mockOnAction).not.toHaveBeenCalled();
    });
  });

  describe('Action visibility controls', () => {
    it('should hide quick actions when showQuickActions is false', () => {
      render(<ActivityActions {...defaultProps} showQuickActions={false} />);
      
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });

    it('should hide main actions when showMainActions is false', () => {
      render(<ActivityActions {...defaultProps} showMainActions={false} />);
      
      expect(screen.queryByTestId('file-text-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('more-vertical-icon')).not.toBeInTheDocument();
    });

    it('should show expand/collapse when showExpandCollapse is true', () => {
      render(
        <ActivityActions 
          {...defaultProps} 
          showExpandCollapse={true}
          isExpanded={false}
        />
      );
      
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });
  });

  describe('Button sizing', () => {
    it('should use correct button sizes for variants', () => {
      const { rerender } = render(<ActivityActions {...defaultProps} variant="full" />);
      
      let actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('default');
      
      rerender(<ActivityActions {...defaultProps} variant="compact" />);
      actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('sm');
      
      rerender(<ActivityActions {...defaultProps} variant="minimal" />);
      // Minimal variant doesn't show action buttons, just regular buttons
    });
  });

  describe('Full action set', () => {
    it('should show create incident action', () => {
      render(<ActivityActions {...defaultProps} />);
      
      expect(screen.getByText('Create Incident')).toBeInTheDocument();
    });

    it('should show add to case action', () => {
      render(<ActivityActions {...defaultProps} />);
      
      expect(screen.getByText('Add to Case')).toBeInTheDocument();
    });

    it('should call onAction for create incident', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const createIncidentButton = screen.getByText('Create Incident');
      await user.click(createIncidentButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('create_incident', mockActivity);
    });

    it('should call onAction for add to case', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const addToCaseButton = screen.getByText('Add to Case');
      await user.click(addToCaseButton);
      
      expect(mockOnAction).toHaveBeenCalledWith('add_to_case', mockActivity);
    });
  });

  describe('Expand/Collapse functionality', () => {
    it('should call expand action when collapsed', async () => {
      const user = userEvent.setup();
      render(
        <ActivityActions 
          {...defaultProps} 
          showExpandCollapse={true}
          isExpanded={false}
        />
      );
      
      const expandButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="chevron-down-icon"]')
      );
      
      await user.click(expandButton!);
      expect(mockOnAction).toHaveBeenCalledWith('expand', mockActivity);
    });

    it('should call collapse action when expanded', async () => {
      const user = userEvent.setup();
      render(
        <ActivityActions 
          {...defaultProps} 
          showExpandCollapse={true}
          isExpanded={true}
        />
      );
      
      const collapseButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="chevron-up-icon"]')
      );
      
      await user.click(collapseButton!);
      expect(mockOnAction).toHaveBeenCalledWith('collapse', mockActivity);
    });
  });

  describe('Specialized variants', () => {
    it('should render ActivityActionsCompact correctly', () => {
      render(<ActivityActionsCompact activity={mockActivity} />);
      
      const actionButtons = screen.getAllByTestId('action-button');
      expect(actionButtons[0].className).toContain('sm');
    });

    it('should render ActivityActionsMinimal correctly', () => {
      render(<ActivityActionsMinimal activity={mockActivity} showExpandCollapse={true} />);
      
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });

    it('should render ActivityActionsTooltip correctly', () => {
      render(<ActivityActionsTooltip activity={mockActivity} />);
      
      expect(screen.getByTestId('more-vertical-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('eye-icon')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ActivityActions {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const firstButton = screen.getAllByRole('button')[0];
      await user.tab();
      
      expect(firstButton).toHaveFocus();
    });

    it('should handle keyboard activation', async () => {
      const user = userEvent.setup();
      render(<ActivityActions {...defaultProps} />);
      
      const viewButton = screen.getAllByTestId('button').find(btn => 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      viewButton?.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnAction).toHaveBeenCalledWith('view', mockActivity);
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-actions-class';
      const { container } = render(<ActivityActions {...defaultProps} className={customClass} />);
      
      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for full variant', () => {
      const { container } = render(<ActivityActions activity={mockActivity} variant="full" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for compact variant', () => {
      const { container } = render(<ActivityActions activity={mockActivity} variant="compact" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for cluster actions', () => {
      const { container } = render(<ActivityActions activity={mockCluster} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
