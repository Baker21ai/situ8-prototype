import React, { 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState, 
  memo,
  startTransition,
  useLayoutEffect
} from 'react';
import { 
  FixedSizeList, 
  VariableSizeList, 
  FixedSizeGrid,
  ListChildComponentProps,
  GridChildComponentProps,
  areEqual
} from 'react-window';
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
  Grid3X3,
  List,
  Layers,
  TrendingUp,
  Database
} from 'lucide-react';

interface EnhancedVirtualizedListProps {
  items: (EnterpriseActivity | ActivityCluster)[];
  variant: EnterpriseCardVariant;
  onSelect?: (activity: EnterpriseActivity | ActivityCluster) => void;
  onAction?: (action: string, activity: EnterpriseActivity | ActivityCluster) => void;
  selectedItems: Set<string>;
  compactMode?: boolean;
  layoutMode?: 'list' | 'grid' | 'horizontal';
  className?: string;
  height?: number;
  width?: number;
  showPrioritySegments?: boolean;
  enableScrollRestoration?: boolean;
  enableKeyboardNavigation?: boolean;
  overscanCount?: number;
  itemGap?: number;
  gridColumns?: number;
  batchSize?: number;
  enableVirtualization?: boolean;
  onItemsRendered?: (params: { visibleStartIndex: number; visibleStopIndex: number }) => void;
}

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  visibleItems: number;
  totalItems: number;
  lastUpdate: number;
}

// Enhanced grid item renderer with performance optimizations
const GridItem = memo<GridChildComponentProps<any>>(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}) => {
  const { items, itemsPerRow, ...otherData } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const item = items[index];
  
  if (!item) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-1">
      <ActivityListItem
        index={index}
        style={{ height: '100%', width: '100%' }}
        data={{ items, ...otherData }}
      />
    </div>
  );
}, areEqual);

GridItem.displayName = 'GridItem';

// Enhanced row renderer for horizontal scrolling
const HorizontalRow = memo<ListChildComponentProps<any>>(({ index, style, data }) => {
  const { items, itemsPerRow, ...otherData } = data;
  const startIndex = index * itemsPerRow;
  const endIndex = Math.min(startIndex + itemsPerRow, items.length);
  const rowItems = items.slice(startIndex, endIndex);

  return (
    <div style={style} className="flex gap-2 px-4">
      {rowItems.map((item, itemIndex) => (
        <div key={`${startIndex + itemIndex}`} className="flex-shrink-0">
          <ActivityListItem
            index={startIndex + itemIndex}
            style={{ height: '100%', minWidth: '280px' }}
            data={{ items, ...otherData }}
          />
        </div>
      ))}
    </div>
  );
}, areEqual);

HorizontalRow.displayName = 'HorizontalRow';

// Priority-based virtual segments
interface VirtualSegment {
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

export const EnhancedVirtualizedList = memo<EnhancedVirtualizedListProps>(({
  items,
  variant,
  onSelect,
  onAction,
  selectedItems,
  compactMode = false,
  layoutMode = 'list',
  className = '',
  height = 400,
  width,
  showPrioritySegments = false,
  enableScrollRestoration = true,
  enableKeyboardNavigation = true,
  overscanCount = 20, // Increased for better performance with large datasets
  itemGap = 4,
  gridColumns = 3,
  batchSize = 100,
  enableVirtualization = true,
  onItemsRendered
}) => {
  const listRef = useRef<FixedSizeList | VariableSizeList | FixedSizeGrid>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    visibleItems: 0,
    totalItems: items.length,
    lastUpdate: Date.now()
  });

  // Performance monitoring
  const measurePerformance = useCallback((operation: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime: end - start,
      lastUpdate: Date.now()
    }));
  }, []);

  // Determine if we need variable heights
  const needsVariableHeight = useMemo(() => {
    return items.some(item => 
      ('clusterType' in item && item.clusterType === 'cluster') ||
      variant === 'evidence' ||
      variant === 'stream'
    ) && layoutMode === 'list';
  }, [items, variant, layoutMode]);

  // Create priority-based segments with virtualization in mind
  const prioritySegments = useMemo((): VirtualSegment[] => {
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

    const segments: VirtualSegment[] = [];
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

  // Calculate grid dimensions
  const { itemsPerRow, rowCount } = useMemo(() => {
    if (layoutMode !== 'grid') {
      return { itemsPerRow: 1, rowCount: flattenedItems.length };
    }
    
    const itemsPerRow = gridColumns;
    const rowCount = Math.ceil(flattenedItems.length / itemsPerRow);
    return { itemsPerRow, rowCount };
  }, [layoutMode, gridColumns, flattenedItems.length]);

  // Item data for react-window with performance optimizations
  const itemData = useMemo(() => ({
    items: flattenedItems,
    variant,
    onSelect,
    onAction,
    selectedItems,
    compactMode,
    layoutMode,
    itemsPerRow,
    itemGap
  }), [flattenedItems, variant, onSelect, onAction, selectedItems, compactMode, layoutMode, itemsPerRow, itemGap]);

  // Calculate item dimensions
  const itemDimensions = useMemo(() => {
    const baseHeight = getItemHeight(variant, undefined, compactMode);
    const itemWidth = layoutMode === 'grid' 
      ? Math.floor((width || 800) / gridColumns) - itemGap
      : width || '100%';
    
    if (needsVariableHeight) {
      return {
        height: createItemSizeGetter(flattenedItems, variant, compactMode),
        width: itemWidth
      };
    }
    
    return {
      height: baseHeight,
      width: itemWidth
    };
  }, [needsVariableHeight, flattenedItems, variant, compactMode, layoutMode, gridColumns, itemGap, width]);

  // Scroll restoration with batching
  useLayoutEffect(() => {
    if (enableScrollRestoration && listRef.current && scrollOffset > 0) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          if ('scrollTo' in listRef.current) {
            listRef.current.scrollTo(scrollOffset);
          } else if ('scrollToPosition' in listRef.current) {
            listRef.current.scrollToPosition({ scrollLeft: 0, scrollTop: scrollOffset });
          }
        }
      });
    }
  }, [enableScrollRestoration, scrollOffset]);

  // Enhanced keyboard navigation with batch updates
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation || !listRef.current) return;

    const moveIndex = (direction: 'up' | 'down' | 'left' | 'right', amount = 1) => {
      setFocusedIndex(prev => {
        let newIndex = prev;
        
        switch (direction) {
          case 'down':
            newIndex = Math.min(prev + amount, flattenedItems.length - 1);
            break;
          case 'up':
            newIndex = Math.max(prev - amount, 0);
            break;
          case 'left':
            if (layoutMode === 'grid') {
              newIndex = Math.max(prev - 1, Math.floor(prev / itemsPerRow) * itemsPerRow);
            }
            break;
          case 'right':
            if (layoutMode === 'grid') {
              newIndex = Math.min(prev + 1, Math.min(Math.floor(prev / itemsPerRow) * itemsPerRow + itemsPerRow - 1, flattenedItems.length - 1));
            }
            break;
        }
        
        return newIndex;
      });
    };

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        startTransition(() => {
          moveIndex('down', layoutMode === 'grid' ? itemsPerRow : 1);
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        startTransition(() => {
          moveIndex('up', layoutMode === 'grid' ? itemsPerRow : 1);
        });
        break;
      case 'ArrowLeft':
        if (layoutMode === 'grid') {
          event.preventDefault();
          startTransition(() => moveIndex('left'));
        }
        break;
      case 'ArrowRight':
        if (layoutMode === 'grid') {
          event.preventDefault();
          startTransition(() => moveIndex('right'));
        }
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
        if ('scrollToItem' in listRef.current) {
          listRef.current.scrollToItem(0, 'start');
        }
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = flattenedItems.length - 1;
        setFocusedIndex(lastIndex);
        if ('scrollToItem' in listRef.current) {
          listRef.current.scrollToItem(lastIndex, 'end');
        }
        break;
      case 'PageDown':
        event.preventDefault();
        startTransition(() => {
          moveIndex('down', Math.floor(height / (itemDimensions.height as number || 100)));
        });
        break;
      case 'PageUp':
        event.preventDefault();
        startTransition(() => {
          moveIndex('up', Math.floor(height / (itemDimensions.height as number || 100)));
        });
        break;
    }
  }, [enableKeyboardNavigation, flattenedItems, focusedIndex, onSelect, layoutMode, itemsPerRow, height, itemDimensions.height]);

  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enableKeyboardNavigation, handleKeyDown]);

  // Enhanced scroll to focused item with smooth scrolling
  useEffect(() => {
    if (listRef.current && enableKeyboardNavigation) {
      if (layoutMode === 'grid' && 'scrollToItem' in listRef.current) {
        const rowIndex = Math.floor(focusedIndex / itemsPerRow);
        listRef.current.scrollToItem({ rowIndex, columnIndex: focusedIndex % itemsPerRow, align: 'smart' });
      } else if ('scrollToItem' in listRef.current) {
        listRef.current.scrollToItem(focusedIndex, 'smart');
      }
    }
  }, [focusedIndex, enableKeyboardNavigation, layoutMode, itemsPerRow]);

  // Enhanced items rendered callback with performance tracking
  const handleItemsRendered = useCallback((params: any) => {
    const visibleCount = params.visibleStopIndex - params.visibleStartIndex + 1;
    
    setPerformanceMetrics(prev => ({
      ...prev,
      visibleItems: visibleCount,
      totalItems: flattenedItems.length
    }));
    
    onItemsRendered?.(params);
  }, [flattenedItems.length, onItemsRendered]);

  // Enhanced scroll handler with throttling
  const handleScroll = useCallback(({ scrollOffset: newOffset, scrollDirection }: any) => {
    if (enableScrollRestoration) {
      setScrollOffset(newOffset);
    }
    
    // Track scroll performance
    setIsScrolling(true);
    const timeoutId = setTimeout(() => setIsScrolling(false), 150);
    
    return () => clearTimeout(timeoutId);
  }, [enableScrollRestoration]);

  // Memory optimization: Clear cache when items change significantly
  useEffect(() => {
    if (listRef.current && 'resetAfterIndex' in listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [items.length, variant, compactMode]);

  // Performance stats component
  const PerformanceStats = memo(() => (
    <div className="flex-shrink-0 p-2 border-t bg-gray-50 text-xs text-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {flattenedItems.length.toLocaleString()} items
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {performanceMetrics.visibleItems} visible
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {performanceMetrics.renderTime.toFixed(1)}ms render
          </span>
          {isScrolling && (
            <span className="text-blue-600 animate-pulse">Scrolling...</span>
          )}
        </div>
        {enableKeyboardNavigation && (
          <span>↑↓←→: Navigate • Enter: Select • Home/End: Jump • PgUp/PgDn: Page</span>
        )}
      </div>
    </div>
  ));
  PerformanceStats.displayName = 'PerformanceStats';

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

  // Render non-virtualized list for small datasets (better performance)
  if (!enableVirtualization || flattenedItems.length < 100) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 overflow-auto p-4">
          <div className={`${layoutMode === 'grid' ? `grid grid-cols-${gridColumns} gap-${itemGap}` : 'space-y-2'}`}>
            {flattenedItems.map((item, index) => (
              <div key={`${item.id}-${index}`}>
                <ActivityListItem
                  index={index}
                  style={{}}
                  data={itemData}
                />
              </div>
            ))}
          </div>
        </div>
        <PerformanceStats />
      </div>
    );
  }

  return (
    <VirtualScrollErrorWrapper 
      itemCount={flattenedItems.length}
      context="EnhancedVirtualizedList"
      onFallbackToStandardList={() => {
        console.log('Fallback to standard list triggered');
      }}
    >
      <div className={`flex flex-col h-full ${className}`} tabIndex={enableKeyboardNavigation ? 0 : -1}>
        {/* Virtualized Content */}
        <div className="flex-1 overflow-hidden">
          {measurePerformance('render', () => {
            if (layoutMode === 'grid') {
              return (
                <FixedSizeGrid
                  ref={listRef as React.RefObject<FixedSizeGrid>}
                  height={height}
                  width={width || '100%'}
                  rowCount={rowCount}
                  columnCount={itemsPerRow}
                  rowHeight={itemDimensions.height as number}
                  columnWidth={itemDimensions.width as number}
                  itemData={itemData}
                  onItemsRendered={handleItemsRendered}
                  onScroll={handleScroll}
                  overscanRowCount={Math.ceil(overscanCount / itemsPerRow)}
                  overscanColumnCount={1}
                  className="virtualized-grid"
                >
                  {GridItem}
                </FixedSizeGrid>
              );
            } else if (needsVariableHeight) {
              return (
                <VariableSizeList
                  ref={listRef as React.RefObject<VariableSizeList>}
                  height={height}
                  width={width || '100%'}
                  itemCount={flattenedItems.length}
                  itemSize={itemDimensions.height as (index: number) => number}
                  itemData={itemData}
                  onItemsRendered={handleItemsRendered}
                  onScroll={handleScroll}
                  overscanCount={overscanCount}
                  className="virtualized-list"
                >
                  {layoutMode === 'horizontal' ? HorizontalRow : ActivityListItem}
                </VariableSizeList>
              );
            } else {
              return (
                <FixedSizeList
                  ref={listRef as React.RefObject<FixedSizeList>}
                  height={height}
                  width={width || '100%'}
                  itemCount={layoutMode === 'horizontal' ? Math.ceil(flattenedItems.length / itemsPerRow) : flattenedItems.length}
                  itemSize={itemDimensions.height as number}
                  itemData={itemData}
                  onItemsRendered={handleItemsRendered}
                  onScroll={handleScroll}
                  overscanCount={overscanCount}
                  className="virtualized-list"
                >
                  {layoutMode === 'horizontal' ? HorizontalRow : ActivityListItem}
                </FixedSizeList>
              );
            }
          })}
        </div>

        {/* Performance Statistics */}
        <PerformanceStats />
      </div>
    </VirtualScrollErrorWrapper>
  );
});

EnhancedVirtualizedList.displayName = 'EnhancedVirtualizedList';