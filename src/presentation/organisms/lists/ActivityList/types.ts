/**
 * TypeScript interfaces for ActivityList compound component
 */

import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';
import { Priority } from '../../../../../lib/utils/status';
import { EnterpriseCardVariant } from '../../../../../components/EnterpriseActivityCard';

// Filter state for activities
export interface ActivityFilterState {
  search: string;
  priorities: Priority[];
  statuses: string[];
  types: string[];
  locations: string[];
  timeRange: 'live' | '15m' | '1h' | '4h' | '24h' | 'custom';
  businessImpact: string[];
  confidenceThreshold: number;
  showClusters: boolean;
  aiFiltering: boolean;
}

// Performance metrics
export interface ActivityPerformanceMetrics {
  totalActivities: number;
  renderTime: number;
  filteredCount: number;
  criticalCount: number;
  averageConfidence: number;
  processingRate: number;
}

// Layout modes
export type ActivityLayoutMode = 'grid' | 'horizontal';
export type ActivityViewMode = 'stream' | 'minimal' | 'summary';

// Context data for compound component
export interface ActivityListContextData {
  // Data
  activities: (EnterpriseActivity | ActivityCluster)[];
  filteredActivities: (EnterpriseActivity | ActivityCluster)[];
  
  // State
  filters: ActivityFilterState;
  selectedItems: Set<string>;
  viewMode: ActivityViewMode;
  layoutMode: ActivityLayoutMode;
  compactMode: boolean;
  useVirtualScrolling: boolean;
  showPerformanceMetrics: boolean;
  
  // Metrics
  performanceMetrics: ActivityPerformanceMetrics;
  priorityMetrics: Record<Priority, number>;
  
  // Event handlers
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  
  // State setters
  setFilters: (filters: Partial<ActivityFilterState>) => void;
  setSelectedItems: (items: Set<string>) => void;
  setViewMode: (mode: ActivityViewMode) => void;
  setLayoutMode: (mode: ActivityLayoutMode) => void;
  setCompactMode: (compact: boolean) => void;
  setUseVirtualScrolling: (enabled: boolean) => void;
  setShowPerformanceMetrics: (show: boolean) => void;
  
  // Derived data
  hasSelection: boolean;
  isEmpty: boolean;
  
  // Configuration
  realTimeMode?: boolean;
  height?: number;
  className?: string;
}

// Component props
export interface ActivityListProps {
  activities: (EnterpriseActivity | ActivityCluster)[];
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  realTimeMode?: boolean;
  className?: string;
  height?: number;
  children?: React.ReactNode;
}

// Header component props
export interface ActivityListHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

// Content component props
export interface ActivityListContentProps {
  className?: string;
  height?: number;
}

// Footer component props
export interface ActivityListFooterProps {
  className?: string;
}

// Filters component props
export interface ActivityListFiltersProps {
  className?: string;
  showAdvanced?: boolean;
}

// Stats component props
export interface ActivityListStatsProps {
  className?: string;
  detailed?: boolean;
}

// Search component props
export interface ActivityListSearchProps {
  placeholder?: string;
  className?: string;
}

// View toggle component props
export interface ActivityListViewToggleProps {
  className?: string;
}

// Priority segment for display
export interface PrioritySegment {
  priority: Priority;
  items: (EnterpriseActivity | ActivityCluster)[];
  count: number;
  color: {
    bg: string;
    border: string;
    text: string;
  };
  icon: React.ReactNode;
}

// Compound component type with sub-components
export interface ActivityListCompound {
  (props: ActivityListProps): JSX.Element;
  Header: React.ComponentType<ActivityListHeaderProps>;
  Content: React.ComponentType<ActivityListContentProps>;
  Footer: React.ComponentType<ActivityListFooterProps>;
  Filters: React.ComponentType<ActivityListFiltersProps>;
  Stats: React.ComponentType<ActivityListStatsProps>;
  Search: React.ComponentType<ActivityListSearchProps>;
  ViewToggle: React.ComponentType<ActivityListViewToggleProps>;
}