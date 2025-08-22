import React, { useMemo, useCallback, useRef, useEffect, useState, memo } from 'react';
import { FixedSizeList, VariableSizeList, ListChildComponentProps } from 'react-window';
import { Badge } from '../../../../components/ui/badge';
import { EnterpriseActivity, ActivityCluster } from '../../../../lib/types/activity';
import { EnterpriseCardVariant } from '../../../../components/EnterpriseActivityCard';
import { VirtualScrollErrorWrapper } from '../../atoms/errors';
import { 
  ActivityListItem, 
  getItemHeight, 
  createItemSizeGetter,
  ITEM_HEIGHTS 
} from './ActivityListItem';
import { 
  AlertTriangle, 
  Zap, 
  Clock, 
  Shield, 
  Layers 
} from 'lucide-react';

interface VirtualizedActivityListProps {
  items: (EnterpriseActivity | ActivityCluster)[];
  variant: EnterpriseCardVariant;
  onSelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  selectedItems: Set<string>;
  compactMode?: boolean;
  layoutMode?: 'grid' | 'horizontal';
  className?: string;
  height?: number;
  showPrioritySegments?: boolean;
  enableScrollRestoration?: boolean;
  enableKeyboardNavigation?: boolean;
}

// Priority-based segmented layout for virtual scrolling
interface PrioritySegment {
  priority: 'critical' | 'high' | 'medium' | 'low';
  items: (EnterpriseActivity | ActivityCluster)[];
  startIndex: number;
  endIndex: number;
  color: {
    bg: string;
    border: string;
    text: string;
  };
  icon: React.ReactNode;
}

const PRIORITY_CONFIGS = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: <Zap className="h-4 w-4" />
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <Clock className="h-4 w-4" />
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <Shield className="h-4 w-4" />
  }
};

export const VirtualizedActivityList = memo<VirtualizedActivityListProps>(({
  items,
  variant,
  onSelect,
  onAction,
  selectedItems,
  compactMode = false,
  layoutMode = 'grid',
  className = '',
  height = 400,
  // Default off to avoid top whitespace unless explicitly enabled
  showPrioritySegments = false,
  enableScrollRestoration = true,
  enableKeyboardNavigation = true
}) => {
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const measuredHeightsRef = useRef<Map<number, number>>(new Map());
  
  // Determine if we need variable heights (for clusters or different variants)
  const needsVariableHeight = useMemo(() => {
    return items.some(item => 
      ('clusterType' in item && item.clusterType === 'cluster') ||
      variant === 'evidence' ||
      variant === 'stream'
    );
  }, [items, variant]);

  // Create priority-based segments for display
  const prioritySegments = useMemo((): PrioritySegment[] => {
    if (!showPrioritySegments) return [];

    const grouped = {
      critical: [] as (EnterpriseActivity | ActivityCluster)[],
      high: [] as (EnterpriseActivity | ActivityCluster)[],
      medium: [] as (EnterpriseActivity | ActivityCluster)[],
      low: [] as (EnterpriseActivity | ActivityCluster)[]
    };

    items.forEach((item) => {
      const priority = 'clusterType' in item && item.clusterType === 'cluster' 
        ? item.highestPriority 
        : item.priority;
      
      if (grouped[priority as keyof typeof grouped]) {
        grouped[priority as keyof typeof grouped].push(item);
      }
    });

    const segments: PrioritySegment[] = [];
    let currentIndex = 0;

    (['critical', 'high', 'medium', 'low'] as const).forEach((priority) => {
      if (grouped[priority].length > 0) {
        segments.push({
          priority,
          items: grouped[priority],
          startIndex: currentIndex,
          endIndex: currentIndex + grouped[priority].length - 1,
          color: PRIORITY_CONFIGS[priority],
          icon: PRIORITY_CONFIGS[priority].icon
        });
        currentIndex += grouped[priority].length;
      }
    });

    return segments;
  }, [items, showPrioritySegments]);

  // Flatten items for virtualization while maintaining priority order
  const flattenedItems = useMemo(() => {
    if (!showPrioritySegments) return items;
    
    return prioritySegments.reduce((acc, segment) => {
      return [...acc, ...segment.items];
    }, [] as (EnterpriseActivity | ActivityCluster)[]);
  }, [items, prioritySegments, showPrioritySegments]);

  // Item data for react-window
  const itemData = useMemo(() => ({
    items: flattenedItems,
    variant,
    onSelect,
    onAction,
    selectedItems,
    compactMode,
    layoutMode,
    onMeasureHeight: (index: number, height: number) => {
      const prev = measuredHeightsRef.current.get(index);
      if (!prev || Math.abs(prev - height) > 2) {
        measuredHeightsRef.current.set(index, height);
        // Invalidate sizes from this index downwards to fix overlaps
        if (listRef.current && 'resetAfterIndex' in listRef.current) {
          (listRef.current as VariableSizeList).resetAfterIndex(index, true);
        }
      }
    }
  }), [flattenedItems, variant, onSelect, onAction, selectedItems, compactMode, layoutMode]);

  // Calculate item height or use size getter for variable heights
  const itemHeight = useMemo(() => {
    if (needsVariableHeight) {
      const fallbackGetter = createItemSizeGetter(flattenedItems, variant, compactMode);
      return (index: number) => measuredHeightsRef.current.get(index) || fallbackGetter(index);
    }
    return getItemHeight(variant, undefined, compactMode);
  }, [needsVariableHeight, flattenedItems, variant, compactMode]);

  // Scroll restoration
  useEffect(() => {
    if (enableScrollRestoration && listRef.current && scrollOffset > 0) {
      listRef.current.scrollTo(scrollOffset);
    }
  }, [enableScrollRestoration, scrollOffset]);

  // When layout-affecting props change, invalidate all cached sizes
  useEffect(() => {
    measuredHeightsRef.current.clear();
    if (listRef.current && 'resetAfterIndex' in listRef.current) {
      (listRef.current as VariableSizeList).resetAfterIndex(0, true);
    }
  }, [variant, compactMode, layoutMode, flattenedItems.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation || !listRef.current) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, flattenedItems.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (flattenedItems[focusedIndex]) {
          onSelect?.(flattenedItems[focusedIndex]);
        }
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        listRef.current.scrollToItem(0, 'start');
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = flattenedItems.length - 1;
        setFocusedIndex(lastIndex);
        listRef.current.scrollToItem(lastIndex, 'end');
        break;
    }
  }, [enableKeyboardNavigation, flattenedItems, focusedIndex, onSelect]);

  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enableKeyboardNavigation, handleKeyDown]);

  // Scroll to focused item
  useEffect(() => {
    if (listRef.current && enableKeyboardNavigation) {
      listRef.current.scrollToItem(focusedIndex, 'smart');
    }
  }, [focusedIndex, enableKeyboardNavigation]);

  // Performance optimization: use intersection observer for heavy content lazy loading
  const onItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    // Mark items as visible for lazy loading optimization
    // This can be used to defer loading of thumbnails, videos, etc.
    console.debug(`Rendering items ${visibleStartIndex} to ${visibleStopIndex}`);
  }, []);

  // Handle scroll position updates for restoration
  const onScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (enableScrollRestoration) {
      setScrollOffset(scrollOffset);
    }
  }, [enableScrollRestoration]);

  // Render priority segment headers (when using segmented view)
  const PriorityHeader = memo<{ segment: PrioritySegment; index: number }>(({ segment, index }) => (
    <div className={`${segment.color.bg} border ${segment.color.border} rounded-lg mb-2`}>
      <div className={`p-3 border-b ${segment.color.border} ${segment.color.text}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {segment.icon}
            <h3 className="font-semibold uppercase text-sm">
              {segment.priority} Priority
            </h3>
            <Badge variant="outline" className={`${segment.color.text} border-current`}>
              {segment.items.length}
            </Badge>
          </div>
          {segment.priority === 'critical' && segment.items.length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">IMMEDIATE ACTION REQUIRED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  PriorityHeader.displayName = 'PriorityHeader';

  if (flattenedItems.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <div className="text-lg font-medium">No activities found</div>
          <div className="text-sm">Try adjusting your filters or search criteria</div>
        </div>
      </div>
    );
  }

  // Priority overview stats
  const priorityStats = useMemo(() => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    flattenedItems.forEach(item => {
      const priority = 'clusterType' in item && item.clusterType === 'cluster' 
        ? item.highestPriority 
        : item.priority;
      if (stats[priority as keyof typeof stats] !== undefined) {
        stats[priority as keyof typeof stats]++;
      }
    });
    return stats;
  }, [flattenedItems]);

  return (
    <VirtualScrollErrorWrapper 
      itemCount={flattenedItems.length}
      context="VirtualizedActivityList"
      onFallbackToStandardList={() => {
        console.log('Fallback to standard list triggered');
        // This could trigger a prop to switch to non-virtualized mode
      }}
    >
      <div className={`flex flex-col h-full ${className}`}>
        {/* Priority Overview - Only show if there are activities and totals > 0 */}
        {showPrioritySegments && flattenedItems.length > 0 && (priorityStats.critical + priorityStats.high + priorityStats.medium + priorityStats.low) > 0 && (
          <div className="flex-shrink-0 p-2">
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-red-600">{priorityStats.critical}</div>
                <div className="text-xs text-red-800">Critical</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-orange-600">{priorityStats.high}</div>
                <div className="text-xs text-orange-800">High</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-yellow-600">{priorityStats.medium}</div>
                <div className="text-xs text-yellow-800">Medium</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-600">{priorityStats.low}</div>
                <div className="text-xs text-green-800">Low</div>
              </div>
            </div>
          </div>
        )}

        {/* Virtualized List with Error Boundary Protection */}
        <div className="flex-1 overflow-hidden" tabIndex={enableKeyboardNavigation ? 0 : -1}>
          {needsVariableHeight ? (
            <VariableSizeList
              ref={listRef as React.RefObject<VariableSizeList>}
              height={height}
              width="100%"
              itemCount={flattenedItems.length}
              itemSize={itemHeight as (index: number) => number}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              onScroll={onScroll}
              overscanCount={5} // Render 5 extra items for smooth scrolling
              className="virtualized-list"
            >
              {ActivityListItem}
            </VariableSizeList>
          ) : (
            <FixedSizeList
              ref={listRef as React.RefObject<FixedSizeList>}
              height={height}
              width="100%"
              itemCount={flattenedItems.length}
              itemSize={itemHeight as number}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              onScroll={onScroll}
              overscanCount={10} // More items for fixed size (cheaper to render)
              className="virtualized-list"
            >
              {ActivityListItem}
            </FixedSizeList>
          )}
        </div>

        {/* Performance indicators */}
        <div className="flex-shrink-0 p-2 border-t bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Showing {flattenedItems.length.toLocaleString()} activities • 
              Virtual scrolling enabled • 
              Memory optimized
            </span>
            {enableKeyboardNavigation && (
              <span>↑↓: Navigate • Enter: Select • Home/End: Jump</span>
            )}
          </div>
        </div>
      </div>
    </VirtualScrollErrorWrapper>
  );
});

VirtualizedActivityList.displayName = 'VirtualizedActivityList';