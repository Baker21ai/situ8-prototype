/**
 * React Context for ActivityList compound component
 * Provides centralized state management for all sub-components
 */

import React, { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { EnterpriseActivity, ActivityCluster } from '../../../../../lib/types/activity';
import { Priority } from '../../../../../lib/utils/status';
import { 
  ActivityListContextData, 
  ActivityFilterState, 
  ActivityPerformanceMetrics,
  ActivityViewMode,
  ActivityLayoutMode
} from './types';

// Context creation
const ActivityListContext = createContext<ActivityListContextData | null>(null);

// Hook to use the context
export function useActivityListContext(): ActivityListContextData {
  const context = useContext(ActivityListContext);
  if (!context) {
    throw new Error('ActivityList components must be used within an ActivityList provider');
  }
  return context;
}

// Default filter state
const DEFAULT_FILTERS: ActivityFilterState = {
  search: '',
  priorities: [],
  statuses: [],
  types: [],
  locations: [],
  timeRange: 'live',
  businessImpact: [],
  confidenceThreshold: 0,
  showClusters: true,
  aiFiltering: true
};

// AI-powered intelligent filtering function
const applyAIFiltering = (activities: (EnterpriseActivity | ActivityCluster)[]): (EnterpriseActivity | ActivityCluster)[] => {
  return activities.filter(activity => {
    // Handle clusters
    if ('clusterType' in activity && activity.clusterType === 'cluster') {
      return true; // Always show clusters (they're already filtered)
    }

    const enterpriseActivity = activity as EnterpriseActivity;
    
    // Filter out likely false positives
    if (enterpriseActivity.falsePositiveLikelihood && enterpriseActivity.falsePositiveLikelihood > 0.8) {
      return false;
    }
    
    // Prioritize high-confidence detections
    if (enterpriseActivity.confidence && enterpriseActivity.confidence < 30) {
      return false;
    }
    
    // Business hours filtering for non-critical events
    const hour = enterpriseActivity.timestamp.getHours();
    if (enterpriseActivity.priority === 'low' && (hour < 6 || hour > 22)) {
      return false;
    }
    
    return true;
  });
};

// Intelligent activity clustering algorithm
const clusterActivities = (activities: (EnterpriseActivity | ActivityCluster)[]): (EnterpriseActivity | ActivityCluster)[] => {
  const enterpriseActivities = activities.filter(a => !('clusterType' in a)) as EnterpriseActivity[];
  const existingClusters = activities.filter(a => 'clusterType' in a && a.clusterType === 'cluster') as ActivityCluster[];
  
  const clusters: ActivityCluster[] = [];
  const processed = new Set<string>();
  const result: (EnterpriseActivity | ActivityCluster)[] = [...existingClusters];

  enterpriseActivities.forEach((activity) => {
    if (processed.has(activity.id)) return;

    // Find similar activities (same location, same type, within time window)
    const similar = enterpriseActivities.filter(other => 
      !processed.has(other.id) &&
      other.location === activity.location &&
      other.type === activity.type &&
      Math.abs(other.timestamp.getTime() - activity.timestamp.getTime()) < 15 * 60 * 1000 // 15 minutes
    );

    if (similar.length > 1) {
      // Create cluster
      const priorities = similar.map(a => a.priority);
      const highestPriority = priorities.includes('critical') ? 'critical' :
                             priorities.includes('high') ? 'high' :
                             priorities.includes('medium') ? 'medium' : 'low';

      const timeRange = {
        start: new Date(Math.min(...similar.map(a => a.timestamp.getTime()))),
        end: new Date(Math.max(...similar.map(a => a.timestamp.getTime())))
      };

      const cluster: ActivityCluster = {
        id: `cluster-${activity.id}`,
        clusterType: 'cluster',
        type: activity.type,
        activities: similar,
        representative: similar.find(a => a.priority === highestPriority) || similar[0],
        count: similar.length,
        highestPriority: highestPriority as Priority,
        location: activity.location,
        timeRange,
        isExpanded: false,
        timestamp: similar[0].timestamp,
        priority: highestPriority as Priority,
        status: similar[0].status
      };

      clusters.push(cluster);
      result.push(cluster);
      similar.forEach(a => processed.add(a.id));
    } else {
      result.push(activity);
      processed.add(activity.id);
    }
  });

  return result;
};

// Performance optimized filtering hook
const useFilteredActivities = (activities: (EnterpriseActivity | ActivityCluster)[], filters: ActivityFilterState) => {
  return useMemo(() => {
    let filtered = [...activities];

    // Time range filtering
    const now = Date.now();
    const timeRanges = {
      'live': 5 * 60 * 1000, // 5 minutes
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };

    if (filters.timeRange !== 'custom' && timeRanges[filters.timeRange]) {
      const cutoff = new Date(now - timeRanges[filters.timeRange]);
      filtered = filtered.filter(activity => activity.timestamp >= cutoff);
    }

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(activity => {
        // Handle clusters
        if ('clusterType' in activity && activity.clusterType === 'cluster') {
          return activity.representative.title.toLowerCase().includes(searchLower) ||
                 activity.representative.description?.toLowerCase().includes(searchLower) ||
                 activity.location.toLowerCase().includes(searchLower) ||
                 activity.type.toLowerCase().includes(searchLower);
        }
        
        const enterpriseActivity = activity as EnterpriseActivity;
        return enterpriseActivity.title.toLowerCase().includes(searchLower) ||
               enterpriseActivity.description?.toLowerCase().includes(searchLower) ||
               enterpriseActivity.location.toLowerCase().includes(searchLower) ||
               enterpriseActivity.type.toLowerCase().includes(searchLower) ||
               enterpriseActivity.badgeHolder?.name.toLowerCase().includes(searchLower);
      });
    }

    // Priority filtering
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(activity => {
        const priority = 'clusterType' in activity && activity.clusterType === 'cluster' 
          ? activity.highestPriority 
          : activity.priority;
        return filters.priorities.includes(priority);
      });
    }

    // Status filtering
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(activity => filters.statuses.includes(activity.status));
    }

    // Type filtering
    if (filters.types.length > 0) {
      filtered = filtered.filter(activity => filters.types.includes(activity.type));
    }

    // Location filtering
    if (filters.locations.length > 0) {
      filtered = filtered.filter(activity => 
        filters.locations.some(loc => activity.location.includes(loc))
      );
    }

    // Business impact filtering
    if (filters.businessImpact.length > 0) {
      filtered = filtered.filter(activity => {
        if ('clusterType' in activity && activity.clusterType === 'cluster') {
          const representative = activity.representative as EnterpriseActivity;
          return representative.businessImpact && 
                 filters.businessImpact.includes(representative.businessImpact);
        }
        const enterpriseActivity = activity as EnterpriseActivity;
        return enterpriseActivity.businessImpact && 
               filters.businessImpact.includes(enterpriseActivity.businessImpact);
      });
    }

    // Confidence threshold
    if (filters.confidenceThreshold > 0) {
      filtered = filtered.filter(activity => {
        if ('clusterType' in activity && activity.clusterType === 'cluster') {
          return !activity.representative.confidence || 
                 activity.representative.confidence >= filters.confidenceThreshold;
        }
        const enterpriseActivity = activity as EnterpriseActivity;
        return !enterpriseActivity.confidence || 
               enterpriseActivity.confidence >= filters.confidenceThreshold;
      });
    }

    // AI filtering
    if (filters.aiFiltering) {
      filtered = applyAIFiltering(filtered);
    }

    // Sort by priority then time
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = 'clusterType' in a && a.clusterType === 'cluster' ? a.highestPriority : a.priority;
      const bPriority = 'clusterType' in b && b.clusterType === 'cluster' ? b.highestPriority : b.priority;
      
      const aPriorityNum = priorityOrder[aPriority as keyof typeof priorityOrder];
      const bPriorityNum = priorityOrder[bPriority as keyof typeof priorityOrder];
      
      if (aPriorityNum !== bPriorityNum) return bPriorityNum - aPriorityNum;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Apply clustering if enabled
    if (filters.showClusters) {
      return clusterActivities(filtered);
    }

    return filtered;
  }, [activities, filters]);
};

// Provider component props
interface ActivityListProviderProps {
  activities: (EnterpriseActivity | ActivityCluster)[];
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  realTimeMode?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

// Provider component
export function ActivityListProvider({
  activities,
  onActivitySelect,
  onActivityAction,
  onBulkAction,
  realTimeMode = true,
  height = 400,
  className = '',
  children
}: ActivityListProviderProps) {
  // State management
  const [filters, setFiltersState] = useState<ActivityFilterState>(DEFAULT_FILTERS);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ActivityViewMode>('stream');
  const [layoutMode, setLayoutMode] = useState<ActivityLayoutMode>('grid');
  const [compactMode, setCompactMode] = useState(false);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(true);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  
  const performanceStartTime = useRef<number>();

  // Apply filters
  const filteredActivities = useFilteredActivities(activities, filters);

  // Calculate metrics
  const priorityMetrics = useMemo((): Record<Priority, number> => {
    const metrics = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredActivities.forEach(activity => {
      const priority = 'clusterType' in activity && activity.clusterType === 'cluster' 
        ? activity.highestPriority 
        : activity.priority;
      if (metrics[priority as keyof typeof metrics] !== undefined) {
        metrics[priority as keyof typeof metrics]++;
      }
    });
    return metrics;
  }, [filteredActivities]);

  const performanceMetrics: ActivityPerformanceMetrics = useMemo(() => {
    const enterpriseActivities = activities.filter(a => !('clusterType' in a)) as EnterpriseActivity[];
    const criticalCount = enterpriseActivities.filter(a => a.priority === 'critical').length;
    const confidenceScores = enterpriseActivities.filter(a => a.confidence).map(a => a.confidence!);
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0;

    return {
      totalActivities: activities.length,
      renderTime: performanceStartTime.current ? Date.now() - performanceStartTime.current : 0,
      filteredCount: filteredActivities.length,
      criticalCount,
      averageConfidence,
      processingRate: activities.length / 60
    };
  }, [activities, filteredActivities]);

  // Filter setter with partial updates
  const setFilters = useCallback((newFilters: Partial<ActivityFilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Auto-refresh for real-time mode
  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        performanceStartTime.current = Date.now();
        // Force re-render for performance measurements
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [realTimeMode]);

  // Context value
  const contextValue: ActivityListContextData = useMemo(() => ({
    // Data
    activities,
    filteredActivities,
    
    // State
    filters,
    selectedItems,
    viewMode,
    layoutMode,
    compactMode,
    useVirtualScrolling,
    showPerformanceMetrics,
    
    // Metrics
    performanceMetrics,
    priorityMetrics,
    
    // Event handlers
    onActivitySelect,
    onActivityAction,
    onBulkAction,
    
    // State setters
    setFilters,
    setSelectedItems,
    setViewMode,
    setLayoutMode,
    setCompactMode,
    setUseVirtualScrolling,
    setShowPerformanceMetrics,
    
    // Derived data
    hasSelection: selectedItems.size > 0,
    isEmpty: filteredActivities.length === 0,
    
    // Configuration
    realTimeMode,
    height,
    className
  }), [
    activities,
    filteredActivities,
    filters,
    selectedItems,
    viewMode,
    layoutMode,
    compactMode,
    useVirtualScrolling,
    showPerformanceMetrics,
    performanceMetrics,
    priorityMetrics,
    onActivitySelect,
    onActivityAction,
    onBulkAction,
    setFilters,
    realTimeMode,
    height,
    className
  ]);

  return (
    <ActivityListContext.Provider value={contextValue}>
      {children}
    </ActivityListContext.Provider>
  );
}