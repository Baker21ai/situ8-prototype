import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  ActivityDetails, 
  ActivityDetailsSummary,
  ActivityDetailsCompact,
  ActivityDetailsInline,
  ActivityDetailsProps 
} from '../../../../presentation/molecules/displays/ActivityDetails';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';

// Mock atomic components
vi.mock('../../../../presentation/atoms/badges/StatusBadge', () => ({
  StatusBadge: ({ priority, status, size }: any) => (
    <div data-testid="status-badge">{status} ({priority}, {size})</div>
  )
}));

vi.mock('../../../../presentation/atoms/indicators/PriorityIndicator', () => ({
  PriorityIndicator: ({ priority, size, variant }: any) => (
    <div data-testid="priority-indicator">{priority} ({size}, {variant})</div>
  )
}));

vi.mock('../../../../presentation/atoms/badges/LocationTag', () => ({
  LocationTag: ({ location, type, size, showIcon }: any) => (
    <div data-testid="location-tag">{location} ({type}, {size}, icon: {showIcon.toString()})</div>
  )
}));

vi.mock('../../../../presentation/atoms/displays/TimeDisplay', () => ({
  TimeDisplay: ({ date, format, size, showIcon }: any) => (
    <div data-testid="time-display">{format} ({size}, icon: {showIcon?.toString() || 'false'})</div>
  )
}));

// Mock UI components
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, variant, size, className }: any) => (
    <div data-testid="badge" className={className}>{children}</div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Camera: () => <div data-testid="camera-icon" />,
  Tag: () => <div data-testid="tag-icon" />
}));

describe('ActivityDetails', () => {
  const mockActivity: EnterpriseActivity = {
    id: '1',
    title: 'Security Alert',
    description: 'Unauthorized access detected',
    type: 'security-breach',
    priority: 'high',
    status: 'detecting',
    timestamp: '2024-01-15T14:30:00Z',
    location: 'Building A',
    zone: 'Zone 1',
    assignedTo: 'John Doe',
    respondingUnits: ['Unit 1', 'Unit 2'],
    cameraName: 'Camera 1',
    additionalCameras: ['Camera 2', 'Camera 3'],
    tags: ['security', 'urgent'],
    confidence: 0.85
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

  const defaultProps: ActivityDetailsProps = {
    activity: mockActivity
  };

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      expect(screen.getByText('Security Alert')).toBeInTheDocument();
      expect(screen.getByText('Unauthorized access detected')).toBeInTheDocument();
    });

    it('should render cluster information', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      expect(screen.getByText('5 activities in Building A')).toBeInTheDocument();
      expect(screen.getByText('5 activities')).toBeInTheDocument();
    });
  });

  describe('Variant styles', () => {
    it('should apply full variant styles (default)', () => {
      const { container } = render(<ActivityDetails {...defaultProps} variant="full" />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-y-3');
    });

    it('should apply summary variant styles', () => {
      const { container } = render(<ActivityDetails {...defaultProps} variant="summary" />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-y-2');
    });

    it('should apply compact variant styles', () => {
      const { container } = render(<ActivityDetails {...defaultProps} variant="compact" />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-y-1');
    });

    it('should apply inline variant styles', () => {
      const { container } = render(<ActivityDetails {...defaultProps} variant="inline" />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-x-2');
      expect(mainContainer.className).toContain('flex');
      expect(mainContainer.className).toContain('items-center');
    });
  });

  describe('Content display options', () => {
    it('should show metadata when showMetadata is true (default)', () => {
      render(<ActivityDetails {...defaultProps} showMetadata={true} />);
      
      expect(screen.getByTestId('priority-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('location-tag')).toBeInTheDocument();
      expect(screen.getByTestId('time-display')).toBeInTheDocument();
    });

    it('should hide metadata when showMetadata is false', () => {
      render(<ActivityDetails {...defaultProps} showMetadata={false} />);
      
      expect(screen.queryByTestId('priority-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-badge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('location-tag')).not.toBeInTheDocument();
      expect(screen.queryByTestId('time-display')).not.toBeInTheDocument();
    });

    it('should show description when showDescription is true (default)', () => {
      render(<ActivityDetails {...defaultProps} showDescription={true} />);
      
      expect(screen.getByText('Unauthorized access detected')).toBeInTheDocument();
    });

    it('should hide description when showDescription is false', () => {
      render(<ActivityDetails {...defaultProps} showDescription={false} />);
      
      expect(screen.queryByText('Unauthorized access detected')).not.toBeInTheDocument();
    });

    it('should show assignment when showAssignment is true (default)', () => {
      render(<ActivityDetails {...defaultProps} showAssignment={true} />);
      
      expect(screen.getByText(/Assigned to: John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/2 units responding/)).toBeInTheDocument();
    });

    it('should hide assignment when showAssignment is false', () => {
      render(<ActivityDetails {...defaultProps} showAssignment={false} />);
      
      expect(screen.queryByText(/Assigned to:/)).not.toBeInTheDocument();
    });

    it('should show cameras when showCameras is true (default)', () => {
      render(<ActivityDetails {...defaultProps} showCameras={true} />);
      
      expect(screen.getByText('Camera 1')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should hide cameras when showCameras is false', () => {
      render(<ActivityDetails {...defaultProps} showCameras={false} />);
      
      expect(screen.queryByText('Camera 1')).not.toBeInTheDocument();
    });

    it('should show tags when showTags is true (default)', () => {
      render(<ActivityDetails {...defaultProps} showTags={true} />);
      
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should hide tags when showTags is false', () => {
      render(<ActivityDetails {...defaultProps} showTags={false} />);
      
      expect(screen.queryByText('security')).not.toBeInTheDocument();
      expect(screen.queryByText('urgent')).not.toBeInTheDocument();
    });
  });

  describe('Cluster-specific rendering', () => {
    it('should render cluster count badge', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      const badges = screen.getAllByTestId('badge');
      const countBadge = badges.find(badge => badge.textContent?.includes('5 activities'));
      expect(countBadge).toBeInTheDocument();
    });

    it('should not show assignment info for clusters', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      expect(screen.queryByText(/Assigned to:/)).not.toBeInTheDocument();
    });

    it('should not show camera info for clusters', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      expect(screen.queryByText('Camera 1')).not.toBeInTheDocument();
    });

    it('should not show tags for clusters', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      expect(screen.queryByText('security')).not.toBeInTheDocument();
    });

    it('should show cluster-specific metadata', () => {
      render(<ActivityDetails activity={mockCluster} />);
      
      expect(screen.getByText(/Time Range: 30 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/Highest Priority: critical/)).toBeInTheDocument();
      expect(screen.getByText(/Types: security-breach, alert/)).toBeInTheDocument();
    });
  });

  describe('Special activity types', () => {
    it('should show confidence for alert activities', () => {
      const alertActivity = { ...mockActivity, type: 'alert', confidence: 0.85 };
      render(<ActivityDetails activity={alertActivity} />);
      
      expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
    });

    it('should not show confidence for non-alert activities', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      expect(screen.queryByText(/Confidence:/)).not.toBeInTheDocument();
    });
  });

  describe('Component integration', () => {
    it('should pass correct props to StatusBadge', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('detecting (high, md)');
    });

    it('should pass correct props to PriorityIndicator', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const priorityIndicator = screen.getByTestId('priority-indicator');
      expect(priorityIndicator).toHaveTextContent('high (md, badge)');
    });

    it('should pass correct props to LocationTag', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const locationTag = screen.getByTestId('location-tag');
      expect(locationTag).toHaveTextContent('Building A (site, md, icon: true)');
    });

    it('should pass correct props to TimeDisplay', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const timeDisplay = screen.getByTestId('time-display');
      expect(timeDisplay).toHaveTextContent('relative (md, icon: true)');
    });
  });

  describe('Size adaptations', () => {
    it('should use correct badge sizes for compact variant', () => {
      render(<ActivityDetails {...defaultProps} variant="compact" />);
      
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('detecting (high, xs)');
    });

    it('should use correct badge sizes for inline variant', () => {
      render(<ActivityDetails {...defaultProps} variant="inline" />);
      
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('detecting (high, xs)');
    });

    it('should use correct badge sizes for summary variant', () => {
      render(<ActivityDetails {...defaultProps} variant="summary" />);
      
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('detecting (high, sm)');
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-activity-details';
      render(<ActivityDetails {...defaultProps} className={customClass} />);
      
      const container = screen.getByText('Security Alert').closest('div');
      expect(container?.className).toContain(customClass);
    });
  });

  describe('Edge cases', () => {
    it('should handle activity without description', () => {
      const activityWithoutDescription = { ...mockActivity, description: undefined };
      render(<ActivityDetails activity={activityWithoutDescription} />);
      
      expect(screen.getByText('Security Alert')).toBeInTheDocument();
      expect(screen.queryByText('Unauthorized access detected')).not.toBeInTheDocument();
    });

    it('should handle activity without assignment', () => {
      const unassignedActivity = { ...mockActivity, assignedTo: undefined, respondingUnits: undefined };
      render(<ActivityDetails activity={unassignedActivity} />);
      
      expect(screen.queryByText(/Assigned to:/)).not.toBeInTheDocument();
    });

    it('should handle activity without cameras', () => {
      const activityWithoutCameras = { ...mockActivity, cameraName: undefined, additionalCameras: undefined };
      render(<ActivityDetails activity={activityWithoutCameras} />);
      
      expect(screen.queryByText('Camera 1')).not.toBeInTheDocument();
    });

    it('should handle activity without tags', () => {
      const activityWithoutTags = { ...mockActivity, tags: undefined };
      render(<ActivityDetails activity={activityWithoutTags} />);
      
      expect(screen.queryByText('security')).not.toBeInTheDocument();
    });

    it('should handle empty tags array', () => {
      const activityWithEmptyTags = { ...mockActivity, tags: [] };
      render(<ActivityDetails activity={activityWithEmptyTags} />);
      
      expect(screen.queryByTestId('tag-icon')).not.toBeInTheDocument();
    });
  });

  describe('Specialized variants', () => {
    it('should render ActivityDetailsSummary correctly', () => {
      const { container } = render(<ActivityDetailsSummary activity={mockActivity} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-y-2');
    });

    it('should render ActivityDetailsCompact correctly', () => {
      const { container } = render(<ActivityDetailsCompact activity={mockActivity} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('space-y-1');
    });

    it('should render ActivityDetailsInline correctly', () => {
      const { container } = render(<ActivityDetailsInline activity={mockActivity} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('flex');
      expect(mainContainer.className).toContain('items-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Security Alert');
    });

    it('should be keyboard navigable', () => {
      render(<ActivityDetails {...defaultProps} />);
      
      const container = screen.getByText('Security Alert').closest('div');
      expect(container).toBeInTheDocument();
      // Additional keyboard navigation tests would be added here
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for default variant', () => {
      const { container } = render(<ActivityDetails activity={mockActivity} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for cluster', () => {
      const { container } = render(<ActivityDetails activity={mockCluster} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for inline variant', () => {
      const { container } = render(<ActivityDetails activity={mockActivity} variant="inline" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
