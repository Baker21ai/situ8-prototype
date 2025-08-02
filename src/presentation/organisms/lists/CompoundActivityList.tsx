/**
 * CompoundActivityList Organism Component
 * Combines virtualized and standard activity lists with filtering, sorting, and clustering
 * Provides a complete activity management interface
 */

import React, { useState, useMemo, useCallback } from 'react';
import { VirtualizedActivityList } from './VirtualizedActivityList';
import { ActivityErrorBoundary } from '../../atoms/errors/ActivityErrorBoundary';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';
import { EnterpriseCardVariant } from '../../../../components/EnterpriseActivityCard';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Layers,
  RefreshCw,
  Settings
} from 'lucide-react';

export interface CompoundActivityListProps {
  activities: EnterpriseActivity[];
  variant?: EnterpriseCardVariant;
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  enableVirtualization?: boolean;
  enableClustering?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableSearch?: boolean;
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

type SortField = 'timestamp' | 'priority' | 'status' | 'location' | 'type';
type SortDirection = 'asc' | 'desc';

type FilterState = {
  priority: string[];
  status: string[];
  type: string[];
  location: string[];
  assignedOnly: boolean;
  unassignedOnly: boolean;
};

const INITIAL_FILTER_STATE: FilterState = {
  priority: [],
  status: [],
  type: [],
  location: [],
  assignedOnly: false,
  unassignedOnly: false
};

/**
 * CompoundActivityList - Complete activity management interface
 * Combines search, filtering, sorting, clustering, and virtualization
 * 
 * @example
 * <CompoundActivityList 
 *   activities={activities} 
 *   onActivitySelect={handleSelect}
 *   onActivityAction={handleAction}
 * />
 */
export const CompoundActivityList: React.FC<CompoundActivityListProps> = ({
  activities,
  variant = 'detailed',
  onActivitySelect,
  onActivityAction,
  enableVirtualization = true,
  enableClustering = false,
  enableFiltering = true,
  enableSorting = true,
  enableSearch = true,
  height = 600,
  className = '',
  loading = false,
  error = null,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.location.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query)
      );
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(activity => 
        filters.priority.includes(activity.priority)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(activity => 
        filters.status.includes(activity.status)
      );
    }

    // Type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(activity => 
        filters.type.includes(activity.type)
      );
    }

    // Location filter
    if (filters.location.length > 0) {
      filtered = filtered.filter(activity => 
        filters.location.includes(activity.location)
      );
    }

    // Assignment filters
    if (filters.assignedOnly) {
      filtered = filtered.filter(activity => activity.assignedTo);
    }
    if (filters.unassignedOnly) {
      filtered = filtered.filter(activity => !activity.assignedTo);
    }

    return filtered;
  }, [activities, searchQuery, filters]);

  // Sort activities
  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredActivities, sortField, sortDirection]);

  // Create clusters if enabled
  const processedItems = useMemo(() => {
    if (!enableClustering) {
      return sortedActivities;
    }

    // Simple clustering by location and time (within 30 minutes)
    const clusters: Map<string, EnterpriseActivity[]> = new Map();
    const standalone: EnterpriseActivity[] = [];

    sortedActivities.forEach(activity => {
      const timeKey = Math.floor(new Date(activity.timestamp).getTime() / (30 * 60 * 1000));
      const clusterKey = `${activity.location}-${timeKey}`;
      
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(activity);
    });

    const result: (EnterpriseActivity | ActivityCluster)[] = [];
    
    clusters.forEach((activities, key) => {
      if (activities.length > 1) {
        // Create cluster
        const cluster: ActivityCluster = {
          id: `cluster-${key}`,
          clusterType: 'cluster',
          title: `${activities.length} activities in ${activities[0].location}`,
          description: `Clustered activities from ${activities[0].location}`,
          location: activities[0].location,
          timestamp: activities[0].timestamp,
          lastActivity: activities[activities.length - 1].timestamp,
          count: activities.length,
          highestPriority: activities.reduce((highest, activity) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const currentPriority = priorityOrder[activity.priority as keyof typeof priorityOrder] || 0;
            const highestPriority = priorityOrder[highest as keyof typeof priorityOrder] || 0;
            return currentPriority > highestPriority ? activity.priority : highest;
          }, 'low'),
          types: [...new Set(activities.map(a => a.type))],
          timeRange: `${activities.length} activities over 30 minutes`,
          activities
        };
        result.push(cluster);
      } else {
        result.push(activities[0]);
      }
    });

    return result.sort((a, b) => {
      const aTime = new Date('clusterType' in a ? a.lastActivity : a.timestamp).getTime();
      const bTime = new Date('clusterType' in b ? b.lastActivity : b.timestamp).getTime();
      return sortDirection === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [sortedActivities, enableClustering, sortDirection]);

  // Handle item selection
  const handleItemSelect = useCallback((item: EnterpriseActivity | ActivityCluster) => {
    const itemId = item.id;
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    
    if (onActivitySelect) {
      onActivitySelect(item);
    }
  }, [onActivitySelect]);

  // Handle actions
  const handleItemAction = useCallback((action: string, item: EnterpriseActivity | ActivityCluster) => {
    if (onActivityAction) {
      onActivityAction(action, item);
    }
  }, [onActivityAction]);

  // Get unique values for filters
  const getUniqueValues = (field: keyof EnterpriseActivity) => {
    return [...new Set(activities.map(activity => activity[field] as string))].sort();
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading activities</div>
          <div className="text-sm text-muted-foreground mb-4">{error}</div>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ActivityErrorBoundary>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Header with controls */}
        <div className="flex-shrink-0 border-b bg-background p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Activities</h2>
              <Badge variant="secondary">
                {processedItems.length.toLocaleString()}
              </Badge>
              {enableClustering && (
                <Badge variant="outline">
                  <Layers className="h-3 w-3 mr-1" />
                  Clustered
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              
              {enableFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search and sort controls */}
          <div className="flex items-center gap-4">
            {enableSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {enableSorting && (
              <div className="flex items-center gap-2">
                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Time</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && enableFiltering && (
          <div className="flex-shrink-0 border-b bg-muted/50 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <div className="space-y-1">
                  {['critical', 'high', 'medium', 'low'].map(priority => (
                    <label key={priority} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            priority: e.target.checked
                              ? [...prev.priority, priority]
                              : prev.priority.filter(p => p !== priority)
                          }));
                        }}
                        className="mr-2"
                      />
                      {priority}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="space-y-1">
                  {getUniqueValues('status').map(status => (
                    <label key={status} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            status: e.target.checked
                              ? [...prev.status, status]
                              : prev.status.filter(s => s !== status)
                          }));
                        }}
                        className="mr-2"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity list */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading activities...</span>
            </div>
          ) : enableVirtualization ? (
            <VirtualizedActivityList
              items={processedItems}
              variant={variant}
              onSelect={handleItemSelect}
              onAction={handleItemAction}
              selectedItems={selectedItems}
              height={height}
              layoutMode={viewMode}
              enableKeyboardNavigation
              enableScrollRestoration
            />
          ) : (
            <div className="p-4 space-y-2 overflow-auto" style={{ height }}>
              {processedItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  {/* Standard activity card would go here */}
                  <div className="text-sm font-medium">{item.title || 'Untitled Activity'}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.location} • {'clusterType' in item ? item.lastActivity : item.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ActivityErrorBoundary>
  );
};
