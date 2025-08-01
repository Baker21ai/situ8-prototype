import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card as _Card, CardContent as _CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent as _TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress as _Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { EnterpriseActivityCard } from './EnterpriseActivityCard';
import { EnterpriseActivity, ActivityCluster } from '../lib/types/activity';
import { 
  Search, 
  Filter as _Filter, 
  TrendingUp as _TrendingUp, 
  AlertTriangle, 
  Clock, 
  Target as _Target,
  Users as _Users,
  Building as _Building,
  Camera as _Camera,
  Layers,
  Zap,
  Shield,
  BarChart3,
  Settings as _Settings,
  Download as _Download,
  RefreshCw as _RefreshCw,
  Maximize2,
  Minimize2,
  Eye as _Eye,
  EyeOff as _EyeOff,
  Grid3X3,
  ArrowRight
} from 'lucide-react';

// Enterprise-scale data management
interface EnterpriseFilterState {
  search: string;
  priorities: string[];
  statuses: string[];
  types: string[];
  locations: string[];
  timeRange: 'live' | '15m' | '1h' | '4h' | '24h' | 'custom';
  businessImpact: string[];
  confidenceThreshold: number;
  showClusters: boolean;
  aiFiltering: boolean;
}

interface PerformanceMetrics {
  totalActivities: number;
  renderTime: number;
  filteredCount: number;
  criticalCount: number;
  averageConfidence: number;
  processingRate: number; // activities per minute
}

interface EnterpriseActivityManagerProps {
  activities: EnterpriseActivity[];
  onActivitySelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onActivityAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  onBulkAction?: (action: string, activities: EnterpriseActivity[]) => void;
  realTimeMode?: boolean;
  className?: string;
}

// Intelligent activity clustering algorithm
const clusterActivities = (activities: EnterpriseActivity[], maxDistance: number = 300): (EnterpriseActivity | ActivityCluster)[] => {
  const clusters: ActivityCluster[] = [];
  const processed = new Set<string>();
  const result: (EnterpriseActivity | ActivityCluster)[] = [];

  activities.forEach((activity) => {
    if (processed.has(activity.id)) return;

    // Find similar activities (same location, same type, within time window)
    const similar = activities.filter(other => 
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
        type: activity.type, // Activity type
        activities: similar,
        representative: similar.find(a => a.priority === highestPriority) || similar[0],
        count: similar.length,
        highestPriority: highestPriority as any,
        location: activity.location,
        timeRange,
        isExpanded: false,
        timestamp: similar[0].timestamp,
        priority: highestPriority as any,
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

// AI-powered intelligent filtering
const applyAIFiltering = (activities: EnterpriseActivity[]): EnterpriseActivity[] => {
  return activities.filter(activity => {
    // Filter out likely false positives
    if (activity.falsePositiveLikelihood && activity.falsePositiveLikelihood > 0.8) {
      return false;
    }
    
    // Prioritize high-confidence detections
    if (activity.confidence && activity.confidence < 30) {
      return false;
    }
    
    // Business hours filtering for non-critical events
    const hour = activity.timestamp.getHours();
    if (activity.priority === 'low' && (hour < 6 || hour > 22)) {
      return false;
    }
    
    return true;
  });
};

// Performance optimized filtering
const useFilteredActivities = (activities: EnterpriseActivity[], filters: EnterpriseFilterState) => {
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
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower) ||
        activity.location.toLowerCase().includes(searchLower) ||
        activity.type.toLowerCase().includes(searchLower) ||
        activity.badgeHolder?.name.toLowerCase().includes(searchLower)
      );
    }

    // Priority filtering
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(activity => filters.priorities.includes(activity.priority));
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
      filtered = filtered.filter(activity => 
        activity.businessImpact && filters.businessImpact.includes(activity.businessImpact)
      );
    }

    // Confidence threshold
    if (filters.confidenceThreshold > 0) {
      filtered = filtered.filter(activity => 
        !activity.confidence || activity.confidence >= filters.confidenceThreshold
      );
    }

    // AI filtering
    if (filters.aiFiltering) {
      filtered = applyAIFiltering(filtered);
    }

    // Sort by priority then time
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Apply clustering if enabled
    if (filters.showClusters) {
      return clusterActivities(filtered);
    }

    return filtered;
  }, [activities, filters]);
};

// Priority-based segmented layout
const PrioritySegmentedList = React.memo(({ items, onSelect, onAction, selectedItems, variant, compactMode, layoutMode }: any) => {
  // Group items by priority
  const groupedItems = useMemo(() => {
    const groups = {
      critical: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[]
    };

    items.forEach((item: any) => {
      const priority = 'clusterType' in item && item.clusterType === 'cluster' ? item.highestPriority : item.priority;
      if (groups[priority as keyof typeof groups]) {
        groups[priority as keyof typeof groups].push(item);
      }
    });

    return groups;
  }, [items]);

  const renderPrioritySection = (priority: string, items: any[], bgColor: string, borderColor: string, textColor: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;

    return (
      <div className={`${bgColor} border ${borderColor} rounded-lg mb-4`}>
        <div className={`p-3 border-b ${borderColor} ${textColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="font-semibold uppercase text-sm">
                {priority} Priority
              </h3>
              <Badge variant="outline" className={`${textColor} border-current`}>
                {items.length}
              </Badge>
            </div>
            {priority === 'critical' && items.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">IMMEDIATE ACTION REQUIRED</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3">
          {layoutMode === 'horizontal' ? (
            <div className="overflow-x-auto max-w-full">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {items.map((item: any, index: number) => (
                  <div key={item.id} className="w-72 flex-shrink-0 max-w-full">
                    <EnterpriseActivityCard
                      activity={item}
                      variant={variant}
                      onSelect={onSelect}
                      onAction={onAction}
                      isSelected={selectedItems.has('clusterType' in item && item.clusterType === 'cluster' ? item.id : item.id)}
                      index={index}
                      isVisible={true}
                      compactMode={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 max-w-full">
              {items.map((item: any, index: number) => (
                <div key={item.id} className="w-full max-w-full">
                  <EnterpriseActivityCard
                    activity={item}
                    variant={variant}
                    onSelect={onSelect}
                    onAction={onAction}
                    isSelected={selectedItems.has('type' in item && item.clusterType === 'cluster' ? item.id : item.id)}
                    index={index}
                    isVisible={true}
                    compactMode={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Priority Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{groupedItems.critical.length}</div>
          <div className="text-sm text-red-800">Critical</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{groupedItems.high.length}</div>
          <div className="text-sm text-orange-800">High</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{groupedItems.medium.length}</div>
          <div className="text-sm text-yellow-800">Medium</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{groupedItems.low.length}</div>
          <div className="text-sm text-green-800">Low</div>
        </div>
      </div>

      {/* Critical Priority - Red */}
      {renderPrioritySection(
        'critical',
        groupedItems.critical,
        'bg-red-50',
        'border-red-200',
        'text-red-800',
        <AlertTriangle className="h-4 w-4" />
      )}

      {/* High Priority - Orange */}
      {renderPrioritySection(
        'high',
        groupedItems.high,
        'bg-orange-50',
        'border-orange-200',
        'text-orange-800',
        <Zap className="h-4 w-4" />
      )}

      {/* Medium Priority - Yellow */}
      {renderPrioritySection(
        'medium',
        groupedItems.medium,
        'bg-yellow-50',
        'border-yellow-200',
        'text-yellow-800',
        <Clock className="h-4 w-4" />
      )}

      {/* Low Priority - Green */}
      {renderPrioritySection(
        'low',
        groupedItems.low,
        'bg-green-50',
        'border-green-200',
        'text-green-800',
        <Shield className="h-4 w-4" />
      )}
    </div>
  );
});

export function EnterpriseActivityManager({
  activities,
  onActivitySelect,
  onActivityAction,
  onBulkAction,
  realTimeMode = true,
  className = ''
}: EnterpriseActivityManagerProps) {
  const [filters, setFilters] = useState<EnterpriseFilterState>({
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
  });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'stream' | 'minimal' | 'summary'>('stream');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal'>('grid');
  const [compactMode, setCompactMode] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);

  const performanceStartTime = useRef<number>();

  // Apply filters first
  const filteredActivities = useFilteredActivities(activities, filters);

  // Priority-based metrics calculation
  const priorityMetrics = useMemo(() => {
    const critical = filteredActivities.filter(a => ('clusterType' in a && a.clusterType === 'cluster' ? a.highestPriority : a.priority) === 'critical').length;
    const high = filteredActivities.filter(a => ('clusterType' in a && a.clusterType === 'cluster' ? a.highestPriority : a.priority) === 'high').length;
    const medium = filteredActivities.filter(a => ('clusterType' in a && a.clusterType === 'cluster' ? a.highestPriority : a.priority) === 'medium').length;
    const low = filteredActivities.filter(a => ('clusterType' in a && a.clusterType === 'cluster' ? a.highestPriority : a.priority) === 'low').length;
    
    return { critical, high, medium, low };
  }, [filteredActivities]);

  // Performance metrics calculation (now that filteredActivities is defined)
  const performanceMetrics: PerformanceMetrics = useMemo(() => {
    const criticalCount = activities.filter(a => a.priority === 'critical').length;
    const confidenceScores = activities.filter(a => a.confidence).map(a => a.confidence!);
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length 
      : 0;

    return {
      totalActivities: activities.length,
      renderTime: performanceStartTime.current ? Date.now() - performanceStartTime.current : 0,
      filteredCount: filteredActivities.length,
      criticalCount,
      averageConfidence,
      processingRate: activities.length / 60 // Simplified calculation
    };
  }, [activities, filteredActivities]);

  // Handle selection
  const handleItemSelect = useCallback((item: EnterpriseActivity | ActivityCluster) => {
    onActivitySelect?.(item);
  }, [onActivitySelect]);

  const handleItemAction = useCallback((action: string, item: EnterpriseActivity | ActivityCluster) => {
    onActivityAction?.(action, item);
  }, [onActivityAction]);

  // Bulk operations
  const handleBulkAction = useCallback((action: string) => {
    const selectedActivities = activities.filter(activity => selectedItems.has(activity.id));
    onBulkAction?.(action, selectedActivities);
    setSelectedItems(new Set());
  }, [selectedItems, activities, onBulkAction]);

  // Auto-refresh for real-time mode
  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        // Trigger re-render to show new activities
        performanceStartTime.current = Date.now();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [realTimeMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.getElementById('activity-search')?.focus();
            break;
          case 'r':
            e.preventDefault();
            setFilters(prev => ({ ...prev, aiFiltering: !prev.aiFiltering }));
            break;
          case 'm':
            e.preventDefault();
            setViewMode(prev => prev === 'minimal' ? 'stream' : 'minimal');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  return (
    <div className={`h-full flex flex-col bg-white ${className}`}>
      {/* Enhanced Header with Performance Metrics */}
      <div className="flex-shrink-0 p-3 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Enterprise Activity Center</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {performanceMetrics.filteredCount.toLocaleString()} / {performanceMetrics.totalActivities.toLocaleString()}
            </Badge>
            
            {/* Priority-based badges */}
            {priorityMetrics.critical > 0 && (
              <Badge className="bg-red-500 text-white">
                {priorityMetrics.critical} Critical
              </Badge>
            )}
            {priorityMetrics.high > 0 && (
              <Badge className="bg-orange-500 text-white">
                {priorityMetrics.high} High
              </Badge>
            )}
            {priorityMetrics.medium > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {priorityMetrics.medium} Medium
              </Badge>
            )}
            {priorityMetrics.low > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {priorityMetrics.low} Low
              </Badge>
            )}
            
            {realTimeMode && (
              <Badge className="bg-green-100 text-green-800 animate-pulse">
                LIVE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
              className="text-xs"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLayoutMode(layoutMode === 'grid' ? 'horizontal' : 'grid')}
              className="text-xs"
            >
              {layoutMode === 'grid' ? (
                <>
                  <Grid3X3 className="h-3 w-3 mr-1" />
                  Grid
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Scroll
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactMode(!compactMode)}
              className="text-xs"
            >
              {compactMode ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        {showPerformanceMetrics && (
          <Alert className="mb-3 p-2">
            <BarChart3 className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="grid grid-cols-4 gap-4">
                <div>Avg Confidence: {performanceMetrics.averageConfidence.toFixed(1)}%</div>
                <div>Processing Rate: {performanceMetrics.processingRate.toFixed(1)}/min</div>
                <div>Render Time: {performanceMetrics.renderTime}ms</div>
                <div>Memory Usage: {(performance as any).memory?.usedJSHeapSize ? 
                  `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB` : 'N/A'}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Filter Controls */}
        <div className="flex items-center gap-2 mb-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              id="activity-search"
              placeholder="Search activities, locations, people..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-7 h-8 text-xs"
            />
          </div>

          {/* View Mode */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-auto">
            <TabsList className="h-8 p-1">
              <TabsTrigger value="minimal" className="text-xs px-2 py-1">Minimal</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs px-2 py-1">Summary</TabsTrigger>
              <TabsTrigger value="stream" className="text-xs px-2 py-1">Stream</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Time Range */}
          <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value as any }))}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
            </SelectContent>
          </Select>

          {/* AI Filtering Toggle */}
          <Button
            variant={filters.aiFiltering ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, aiFiltering: !prev.aiFiltering }))}
            className="h-8 px-2 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            AI Filter
          </Button>

          {/* Clustering Toggle */}
          <Button
            variant={filters.showClusters ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, showClusters: !prev.showClusters }))}
            className="h-8 px-2 text-xs"
          >
            <Layers className="h-3 w-3 mr-1" />
            Cluster
          </Button>
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center gap-2 text-xs">
          {/* Priority Filter */}
          <div className="flex gap-1">
            {['critical', 'high', 'medium', 'low'].map(priority => (
              <Button
                key={priority}
                variant={filters.priorities.includes(priority) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    priorities: prev.priorities.includes(priority)
                      ? prev.priorities.filter(p => p !== priority)
                      : [...prev.priorities, priority]
                  }));
                }}
                className="h-6 px-2 text-xs"
              >
                {priority.charAt(0).toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Confidence Threshold */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600">Confidence:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.confidenceThreshold}
              onChange={(e) => setFilters(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
              className="w-16 h-2"
            />
            <span className="text-xs w-8">{filters.confidenceThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="flex-shrink-0 p-2 bg-blue-50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.size} activities selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('escalate')}>
                Escalate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('assign')}>
                Assign
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('resolve')}>
                Resolve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedItems(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="flex-1 overflow-hidden">
        {filteredActivities.length > 0 ? (
          <ScrollArea className="h-full">
            <PrioritySegmentedList
              items={filteredActivities}
              onSelect={handleItemSelect}
              onAction={handleItemAction}
              selectedItems={selectedItems}
              variant={viewMode}
              compactMode={compactMode}
              layoutMode={layoutMode}
            />
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg font-medium">No activities found</div>
              <div className="text-sm">Try adjusting your filters or search criteria</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Showing {filteredActivities.length.toLocaleString()} of {activities.length.toLocaleString()}</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            {realTimeMode && <span>Real-time updates: ON</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>Ctrl+F: Search</span>
            <span>Ctrl+M: Toggle view</span>
            <span>Ctrl+R: Toggle AI filter</span>
          </div>
        </div>
      </div>
    </div>
  );
}